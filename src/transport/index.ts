import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { startHttpServer } from "./http.js";

export const isHttpTransportEnabled = (): boolean =>
  process.env.MCP_TRANSPORT === "http";

export const connectServer = async (server: McpServer): Promise<void> => {
  if (isHttpTransportEnabled()) {
    await startHttpServer(server);
    return;
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
};
