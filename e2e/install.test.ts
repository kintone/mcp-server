import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Client } from "@modelcontextprotocol/sdk/client";
import { createClient, createTransport } from "./client";
import { configSchema } from "../src/config/schema";
import { testConfigSchema } from "./config";
import type { ProvidedConfig } from "../src/config/types/config";

describe("MCP Server Installation E2E Tests", () => {
  const mcpConfig = configSchema.parse(process.env);

  const config: ProvidedConfig = {
    KINTONE_BASE_URL: mcpConfig.KINTONE_BASE_URL,
    KINTONE_USERNAME: mcpConfig.KINTONE_USERNAME,
    KINTONE_PASSWORD: mcpConfig.KINTONE_PASSWORD,
  };

  const testConfig = testConfigSchema.parse(process.env);

  const appId = testConfig.APP_ID;
  const runtime = testConfig.RUNTIME;

  let client: Client;

  beforeAll(async () => {
    const transport = createTransport(runtime, config);
    client = await createClient(transport);
  });

  afterAll(async () => {
    await client.close();
  });

  describe("Tool List Verification", () => {
    it("should list all kintone tools correctly", async () => {
      // Act
      const tools = await client.listTools();
      const toolNames = tools.tools.map((tool) => tool.name);

      // Assert
      expect(tools.tools).toBeInstanceOf(Array);
      expect(tools.tools.length).toBeGreaterThan(0);

      // 特定のツールが含まれていることを確認
      expect(toolNames).toContain("kintone-get-app");

      // すべてのツールがkintoneプレフィックスを持つことを確認
      tools.tools.forEach((tool) => {
        expect(tool).toHaveProperty("name");
        expect(tool).toHaveProperty("description");
        expect(tool).toHaveProperty("inputSchema");
        expect(tool.name).toMatch(/^kintone-/);
      });
    });
  });

  describe("Tool Execution Verification", () => {
    it("should execute kintone-get-app tool correctly", async () => {
      // Act
      const result = await client.callTool({
        name: "kintone-get-app",
        arguments: {
          appId: appId,
        },
      });

      // Assert
      expect(result).not.toHaveProperty("isError");
      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("structuredContent");

      // content配列の検証
      expect(result.content).toBeInstanceOf(Array);
      expect((result.content as unknown[]).length).toBeGreaterThan(0);
      expect((result.content as unknown[])[0]).toHaveProperty("type", "text");
      expect((result.content as unknown[])[0]).toHaveProperty("text");

      // structuredContentの検証
      const structuredContent = result.structuredContent as Record<
        string,
        unknown
      >;
      expect(structuredContent).toHaveProperty("appId", appId);
      expect(structuredContent).toHaveProperty("name");
      expect(structuredContent).toHaveProperty("description");
      expect(structuredContent).toHaveProperty("createdAt");
      expect(structuredContent).toHaveProperty("creator");
      expect(structuredContent).toHaveProperty("modifiedAt");
      expect(structuredContent).toHaveProperty("modifier");
    });
  });
});
