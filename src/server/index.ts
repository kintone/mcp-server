import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { shouldEnableTool } from "./tool-filters.js";
import { buildToolDefinition } from "./tool-definitions.js";
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
  const attachmentsDir = options.config.fileConfig.attachmentsDir;
  const enabledTools = tools.filter((tool) =>
    shouldEnableTool(tool.name, toolCondition),
  );
  enabledTools.forEach((tool) =>
    server.registerTool(
      tool.name,
      tool.config,
      createToolCallback(tool.callback, { client, attachmentsDir }),
    ),
  );

  // Overwrite the handler registered by registerTool so that the advertised
  // schemas use JSON Schema 2020-12 instead of the SDK's draft-07 output.
  server.server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: enabledTools.map(buildToolDefinition),
  }));

  return server;
};
