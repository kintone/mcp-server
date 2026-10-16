import type { Server } from "node:http";

export const SHUTDOWN_TIMEOUT_MS = 5000;

export const setupGracefulShutdown = (httpServer: Server): void => {
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
};
