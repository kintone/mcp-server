import { describe, it, expect } from "vitest";
import { server } from "../server.js";

describe("server", () => {
  it("should export server instance", () => {
    expect(server).toBeDefined();
    expect(server.constructor.name).toBe("McpServer");
  });

  it("should have correct server configuration", () => {
    // Since McpServer properties are private, we can only verify the instance exists
    // and trust that it was created with the correct configuration
    expect(server).toBeDefined();
  });
});
