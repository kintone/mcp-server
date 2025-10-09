import { describe, it, expect, afterEach } from "vitest";
import type { Runtime } from "./client";
import { createClient, createTransport } from "./client";
import type { ProvidedConfig } from "../config/types/config";

describe("MCP Server Installation E2E Tests", () => {
  const appId = process.env.APP_ID || "1";

  const config: ProvidedConfig = {
    KINTONE_BASE_URL:
      process.env.KINTONE_BASE_URL || "https://example.kintone.com",
    KINTONE_USERNAME: process.env.KINTONE_USERNAME || "user",
    KINTONE_PASSWORD: process.env.KINTONE_PASSWORD || "pass",
  };

  describe("Tool List Verification", () => {
    it.each`
      runtime
      ${"docker"}
      ${"npm"}
    `(
      "should list all kintone tools correctly (runtime: $runtime)",
      async ({ runtime }: { runtime: Runtime }) => {
        // Arrange
        const transport = createTransport(runtime, config);
        const client = await createClient(transport);

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
      },
    );
  });

  describe("Tool Execution Verification", () => {
    it.each`
      runtime
      ${"docker"}
      ${"npm"}
    `(
      "should execute kintone-get-app tool correctly (runtime: $runtime)",
      async ({ runtime }: { runtime: Runtime }) => {
        // Arrange
        const transport = createTransport(runtime, config);
        const client = await createClient(transport);

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
      },
    );
  });
});
