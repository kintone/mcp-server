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

const SHUTDOWN_TIMEOUT_MS = 5000;

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

    let shuttingDown = false;
    const shutdown = () => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.error("Shutting down HTTP server...");
      httpServer.close();

      // Force exit if connections linger
      setTimeout(() => {
        console.error("Forcing shutdown after timeout");
        httpServer.closeAllConnections();
      }, SHUTDOWN_TIMEOUT_MS).unref();
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } else {
    console.error("Starting server...");
    const transport = new StdioServerTransport();
    const server = createServer(serverConfig);
    await server.connect(transport);
  }
};

main().catch(console.error);
