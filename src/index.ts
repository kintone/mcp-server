#!/usr/bin/env node
import { createServer, type KintoneMcpServerOptions } from "./server/index.js";
import { connectServer } from "./transport/index.js";
import {
  getFileConfig,
  getKintoneClientConfig,
  getMcpServerConfig,
  getToolConditionConfig,
} from "./config/index.js";

const main = async () => {
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

  await connectServer(server);
};

main().catch(console.error);
