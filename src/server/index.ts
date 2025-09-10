import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { shouldEnableTool } from "./tool-filters.js";
import { getKintoneClient } from "../client/index.js";
import { createToolCallback, tools } from "../tools/index.js";
import type { KintoneMcpServerOptions } from "./types/server.js";

export type { KintoneMcpServerOptions } from "./types/server.js";
export const createServer = (options: KintoneMcpServerOptions): McpServer => {
  const server = new McpServer({
    name: options.name,
    version: options.version,
  });

  const client = getKintoneClient(options.config.clientConfig);
  const toolCondition = options.config.toolConditionConfig;
  tools
    .filter((tool) => shouldEnableTool(tool.name, toolCondition))
    .forEach((tool) =>
      server.registerTool(
        tool.name,
        tool.config,
        createToolCallback(tool.callback, { client }),
      ),
    );

  return server;
};
