import { describe, it, expect } from "vitest";
import { createServer } from "../server.js";

describe("server", () => {
  it("should export createServer function", () => {
    expect(createServer).toBeDefined();
    expect(typeof createServer).toBe("function");
  });

  it("should create server instance with correct configuration", () => {
    const server = createServer();
    expect(server).toBeDefined();
    expect(server.constructor.name).toBe("McpServer");
  });
});
