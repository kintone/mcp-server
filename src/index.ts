#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer, type KintoneMcpServerOptions } from "./server/index.js";
import {
  getFileConfig,
  getKintoneClientConfig,
  getMcpServerConfig,
  getToolConditionConfig,
} from "./config/index.js";

const main = async () => {
  const transport = new StdioServerTransport();
  console.error("Starting server...");

  const mcpServerConfig = getMcpServerConfig();
  const clientConfig = getKintoneClientConfig();
  const fileConfig = getFileConfig();
  const toolConditionConfig = getToolConditionConfig();

  const serverConfig: KintoneMcpServerOptions = {
    name: mcpServerConfig.name,
    version: mcpServerConfig.version,
    config: {
      clientConfig,
      fileConfig,
      toolConditionConfig,
    },
  };
  const server = createServer(serverConfig);

  await server.connect(transport);
};

main().catch(console.error);
