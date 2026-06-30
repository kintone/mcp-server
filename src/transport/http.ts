import {
  createServer as createHttpServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer, type KintoneMcpServerOptions } from "../server/index.js";

const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1MB

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

const normalizeHostname = (h: string): string =>
  h.replace(/^\[/, "").replace(/\]$/, "");

const isAllowedOrigin = (origin: string, hostname: string): boolean => {
  try {
    const originHost = new URL(origin).hostname;
    const normalizedBind = normalizeHostname(hostname);

    // When binding to localhost, allow all loopback variants
    if (LOOPBACK_HOSTS.has(normalizedBind)) {
      return LOOPBACK_HOSTS.has(originHost);
    }

    // When binding to all interfaces (0.0.0.0 / ::), allow loopback origins
    // Other origins are accepted since the server is explicitly exposed
    if (normalizedBind === "0.0.0.0" || normalizedBind === "::") {
      return true;
    }

    // For specific hostname bindings, allow same hostname
    return normalizeHostname(originHost) === normalizedBind;
  } catch {
    return false;
  }
};

const readBody = (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<string | null> => {
  return new Promise((resolve) => {
    let body = "";
    let size = 0;
    let limitExceeded = false;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE && !limitExceeded) {
        limitExceeded = true;
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Payload Too Large" }));
        req.resume(); // drain remaining data
        resolve(null);
        return;
      }
      if (!limitExceeded) {
        body += chunk.toString();
      }
    });
    req.on("end", () => {
      if (!limitExceeded) {
        resolve(body);
      }
    });
    req.on("error", () => {
      if (!limitExceeded) {
        resolve(null);
      }
    });
  });
};

const parseRequestUrl = (req: IncomingMessage): URL | null => {
  try {
    return new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  } catch {
    return null;
  }
};

const handleMcpPost = async (
  req: IncomingMessage,
  res: ServerResponse,
  serverConfig: KintoneMcpServerOptions,
) => {
  // Content-Type validation (POST only)
  const contentType = req.headers["content-type"];
  if (!contentType || !contentType.includes("application/json")) {
    res.writeHead(415, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Unsupported Media Type: expected application/json",
      }),
    );
    return;
  }

  // Read body (returns null if limit exceeded; 413 already sent)
  const rawBody = await readBody(req, res);
  if (rawBody === null) {
    return;
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Bad Request: invalid JSON" }));
    return;
  }

  await handleMcpTransport(req, res, serverConfig, body);
};

const handleMcpTransport = async (
  req: IncomingMessage,
  res: ServerResponse,
  serverConfig: KintoneMcpServerOptions,
  body?: unknown,
) => {
  // Create per-request transport + server (stateless mode)
  let transport: InstanceType<typeof StreamableHTTPServerTransport> | undefined;
  let server: ReturnType<typeof createServer> | undefined;

  const cleanup = () => {
    transport?.close().catch(noop);
    server?.close().catch(noop);
  };
  res.on("close", cleanup);

  try {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    server = createServer(serverConfig);
    await server.connect(transport);
    await transport.handleRequest(req, res, body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
    cleanup();
  }
};

export const startHttpServer = (
  serverConfig: KintoneMcpServerOptions,
  port: number,
  hostname: string,
): Promise<Server> => {
  const httpServer = createHttpServer(async (req, res) => {
    const url = parseRequestUrl(req);
    if (url === null) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Bad Request: invalid URL" }));
      return;
    }

    if (url.pathname !== "/mcp") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Found" }));
      return;
    }

    // Origin header validation (MCP spec MUST)
    const origin = req.headers.origin;
    if (origin !== undefined && !isAllowedOrigin(origin, hostname)) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Forbidden: Origin not allowed" }));
      return;
    }

    if (req.method === "POST") {
      await handleMcpPost(req, res, serverConfig);
    } else {
      // Delegate GET/DELETE to SDK transport (stateless mode returns 405)
      await handleMcpTransport(req, res, serverConfig);
    }
  });

  return new Promise((resolve, reject) => {
    httpServer.on("error", reject);
    httpServer.listen(port, hostname, () => {
      console.error(`HTTP server listening on http://${hostname}:${port}/mcp`);
      resolve(httpServer);
    });
  });
};
