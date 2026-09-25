import { createServer as createHttpServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export const DEFAULT_MCP_PATH = "/mcp";
export const DEFAULT_HOST = "0.0.0.0";
export const DEFAULT_PORT = 3000;

const HEALTH_PATH = "/health";

const requestPathname = (url: string | undefined): string => {
  if (!url) {
    return "/";
  }
  try {
    return new URL(url, "http://localhost").pathname;
  } catch {
    return url.split("?")[0] || "/";
  }
};

const readJsonBody = (req: IncomingMessage): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf-8");
      if (!raw) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
};

const writeJsonError = (
  res: ServerResponse,
  status: number,
  message: string,
  code = -32000,
): void => {
  if (res.headersSent) {
    return;
  }
  res.writeHead(status, { "content-type": "application/json" });
  res.end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code, message },
      id: null,
    }),
  );
};

const formatListenUrl = (
  host: string,
  port: number,
  mcpPath: string,
): string => {
  const displayHost = host === "0.0.0.0" || host === "::" ? "localhost" : host;
  const needsBrackets =
    displayHost.includes(":") && !displayHost.startsWith("[");
  const hostPart = needsBrackets ? `[${displayHost}]` : displayHost;
  return `http://${hostPart}:${port}${mcpPath}`;
};

export type HttpServerOptions = {
  host?: string;
  port?: number;
  mcpPath?: string;
};

export const resolveHttpOptions = (
  options: HttpServerOptions = {},
): { host: string; port: number; mcpPath: string } => {
  const portFromEnv = process.env.PORT;
  const parsedPort =
    portFromEnv !== undefined && portFromEnv !== ""
      ? Number(portFromEnv)
      : undefined;

  const port =
    options.port ??
    (parsedPort !== undefined && Number.isFinite(parsedPort)
      ? parsedPort
      : DEFAULT_PORT);

  return {
    host: options.host ?? process.env.HOST ?? DEFAULT_HOST,
    port,
    mcpPath: options.mcpPath ?? DEFAULT_MCP_PATH,
  };
};

export type HttpServerHandle = {
  port: number;
  host: string;
  url: string;
  close: () => Promise<void>;
};

export const startHttpServer = async (
  server: McpServer,
  options: HttpServerOptions = {},
): Promise<HttpServerHandle> => {
  const { host, port, mcpPath } = resolveHttpOptions(options);

  let queue: Promise<void> = Promise.resolve();

  const handlePost = async (
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> => {
    try {
      const body = await readJsonBody(req);
      await server.close();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (error) {
      if (!res.headersSent) {
        const message =
          error instanceof Error ? error.message : "Internal error";
        writeJsonError(res, 500, message, -32603);
      }
    }
  };

  const httpServer = createHttpServer(
    (req: IncomingMessage, res: ServerResponse) => {
      const pathname = requestPathname(req.url);

      if (pathname === HEALTH_PATH) {
        if (req.method === "GET" || req.method === "HEAD") {
          res.writeHead(200, { "content-type": "text/plain" });
          res.end(req.method === "HEAD" ? undefined : "ok");
          return;
        }
        writeJsonError(res, 405, `Method not allowed: ${req.method ?? "UNKNOWN"}`);
        return;
      }

      if (pathname !== mcpPath) {
        res.writeHead(404).end();
        return;
      }

      if (req.method === "GET" || req.method === "DELETE") {
        writeJsonError(
          res,
          405,
          "Method not allowed: this server does not support server-initiated streams.",
        );
        return;
      }

      if (req.method !== "POST") {
        writeJsonError(res, 405, `Method not allowed: ${req.method ?? "UNKNOWN"}`);
        return;
      }

      queue = queue.catch(() => undefined).then(() => handlePost(req, res));
    },
  );

  await new Promise<void>((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(port, host, () => resolve());
  });

  const address = httpServer.address() as AddressInfo | null;
  const boundPort = address?.port ?? port;
  const url = formatListenUrl(host, boundPort, mcpPath);
  console.error(`MCP server listening on ${url} (port ${boundPort})`);

  return {
    port: boundPort,
    host,
    url,
    close: () =>
      new Promise<void>((resolve, reject) => {
        httpServer.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
};
