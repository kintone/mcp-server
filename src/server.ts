import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tools } from "./tools/index.js";
import { version } from "./version.js";
import { PACKAGE_NAME, type KintoneClientConfigParseResult } from "./config.js";

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

  tools
    .filter((tool) => !tool.disabled?.())
    .forEach((tool) =>
      server.registerTool(tool.name, tool.config, tool.callback),
    );

  return server;
};
