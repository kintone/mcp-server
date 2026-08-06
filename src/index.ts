#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer, type KintoneMcpServerOptions } from "./server/index.js";
import {
  getFileConfig,
  getKintoneClientConfig,
  getMcpServerConfig,
  getToolConditionConfig,
} from "./config/index.js";
import { PACKAGE_NAME } from "./config/schema.js";

const log = (...args: unknown[]) => console.error(`[${PACKAGE_NAME}]`, ...args);

const main = async () => {
  const transport = new StdioServerTransport();
  log("Starting server...");

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

main().catch((error) => {
  log(error);
  // eslint-disable-next-line n/no-process-exit
  process.exit(1);
});
