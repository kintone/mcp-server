#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer, type KintoneMcpServerOptions } from "./server/index.js";
import {
  getFileConfig,
  getKintoneClientConfig,
  getMcpServerConfig,
  getToolConditionConfig,
  getTransportConfig,
} from "./config/index.js";
import { startHttpServer } from "./transport/http.js";
import { setupGracefulShutdown } from "./shutdown.js";

const main = async () => {
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

  const transportConfig = getTransportConfig();

  if (transportConfig.transport === "http") {
    console.error("Starting HTTP server...");
    const httpServer = await startHttpServer(
      serverConfig,
      transportConfig.port,
      transportConfig.hostname,
    );

    setupGracefulShutdown(httpServer);
  } else {
    console.error("Starting server...");
    const transport = new StdioServerTransport();
    const server = createServer(serverConfig);
    await server.connect(transport);
  }
};

main().catch(console.error);
