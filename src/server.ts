import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tools } from "./tools/index.js";
import { version } from "./version.js";
import { PACKAGE_NAME, parseKintoneClientConfig } from "./config/index.js";
import { shouldEnableTool } from "./tool-filters.js";

export const createServer = (): McpServer => {
  const server = new McpServer(
    {
      name: PACKAGE_NAME,
      version,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  const config = parseKintoneClientConfig();

  tools
    .filter((tool) => shouldEnableTool(tool.name, config))
    .forEach((tool) =>
      server.registerTool(tool.name, tool.config, tool.callback),
    );

  return server;
};
