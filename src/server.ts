import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tools } from "./tools/index.js";
import { version } from "./version.js";
import { isApiTokenAuth, PACKAGE_NAME } from "./config/index.js";
import { shouldEnableTool } from "./tool-filters.js";

export const setupServer = (): McpServer => {
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

  tools
    .filter((tool) =>
      shouldEnableTool(tool.name, { isApiTokenAuth: isApiTokenAuth() }),
    )
    .forEach((tool) =>
      server.registerTool(tool.name, tool.config, tool.callback),
    );

  return server;
};
