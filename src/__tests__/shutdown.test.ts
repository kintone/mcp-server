import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Server } from "node:http";
import { setupGracefulShutdown, SHUTDOWN_TIMEOUT_MS } from "../shutdown.js";

const createMockServer = (): Server =>
  ({
    close: vi.fn(),
    closeAllConnections: vi.fn(),
  }) as unknown as Server;

describe("setupGracefulShutdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    process.removeAllListeners("SIGTERM");
    process.removeAllListeners("SIGINT");
  });

  it("closes the server on SIGTERM", () => {
    const server = createMockServer();
    setupGracefulShutdown(server);

    process.emit("SIGTERM");

    expect(server.close).toHaveBeenCalledOnce();
  });

  it("closes the server on SIGINT", () => {
    const server = createMockServer();
    setupGracefulShutdown(server);

    process.emit("SIGINT");

    expect(server.close).toHaveBeenCalledOnce();
  });

  it("only closes once when multiple signals arrive", () => {
    const server = createMockServer();
    setupGracefulShutdown(server);

    process.emit("SIGTERM");
    process.emit("SIGINT");
    process.emit("SIGTERM");

    expect(server.close).toHaveBeenCalledOnce();
  });

  it("forces connections closed after the shutdown timeout", () => {
    const server = createMockServer();
    setupGracefulShutdown(server);

    process.emit("SIGTERM");
    expect(server.closeAllConnections).not.toHaveBeenCalled();

    vi.advanceTimersByTime(SHUTDOWN_TIMEOUT_MS);

    expect(server.closeAllConnections).toHaveBeenCalledOnce();
  });
});
