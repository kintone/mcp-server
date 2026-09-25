import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  resolveHttpOptions,
  startHttpServer,
} from "../http.js";
import { isHttpTransportEnabled } from "../index.js";

describe("transport/http", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("resolveHttpOptions", () => {
    it("uses defaults when env vars are unset", () => {
      delete process.env.HOST;
      delete process.env.PORT;

      expect(resolveHttpOptions()).toEqual({
        host: DEFAULT_HOST,
        port: DEFAULT_PORT,
        mcpPath: "/mcp",
      });
    });

    it("reads HOST and PORT from env", () => {
      process.env.HOST = "127.0.0.1";
      process.env.PORT = "4567";

      expect(resolveHttpOptions()).toEqual({
        host: "127.0.0.1",
        port: 4567,
        mcpPath: "/mcp",
      });
    });
  });

  describe("isHttpTransportEnabled", () => {
    it("returns false unless MCP_TRANSPORT is http", () => {
      delete process.env.MCP_TRANSPORT;
      expect(isHttpTransportEnabled()).toBe(false);

      process.env.MCP_TRANSPORT = "stdio";
      expect(isHttpTransportEnabled()).toBe(false);

      process.env.MCP_TRANSPORT = "http";
      expect(isHttpTransportEnabled()).toBe(true);
    });
  });

  describe("startHttpServer", () => {
    it("serves GET /health without contacting Kintone", async () => {
      const server = new McpServer({ name: "test-server", version: "0.0.0" });
      const handle = await startHttpServer(server, {
        host: "127.0.0.1",
        port: 0,
      });

      const response = await fetch(`http://127.0.0.1:${handle.port}/health`);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe("ok");

      await handle.close();
      await server.close();
    });

    it("returns 404 for unknown routes", async () => {
      const server = new McpServer({ name: "test-server", version: "0.0.0" });
      const handle = await startHttpServer(server, {
        host: "127.0.0.1",
        port: 0,
      });

      const response = await fetch(`http://127.0.0.1:${handle.port}/unknown`);

      expect(response.status).toBe(404);

      await handle.close();
      await server.close();
    });

    it("returns 405 for GET /mcp", async () => {
      const server = new McpServer({ name: "test-server", version: "0.0.0" });
      const handle = await startHttpServer(server, {
        host: "127.0.0.1",
        port: 0,
      });

      const response = await fetch(`http://127.0.0.1:${handle.port}/mcp`);

      expect(response.status).toBe(405);

      await handle.close();
      await server.close();
    });
  });
});
