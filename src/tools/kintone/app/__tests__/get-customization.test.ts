import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getCustomization } from "../get-customization.js";
import { z } from "zod";
import { createMockClient } from "../../../../__tests__/utils.js";

// Mock function for getAppCustomize API call
const mockGetAppCustomize = vi.fn();

const fileResource = {
  type: "FILE",
  file: {
    fileKey: "fileKey123",
    name: "customize.js",
    contentType: "text/javascript",
    size: "1024",
  },
};
const urlResource = { type: "URL", url: "https://example.com/customize.js" };

describe("get-customization tool", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      KINTONE_BASE_URL: "https://example.cybozu.com",
      KINTONE_USERNAME: "testuser",
      KINTONE_PASSWORD: "testpass",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("tool configuration", () => {
    it("should have correct name", () => {
      expect(getCustomization.name).toBe("kintone-get-customization");
    });

    it("should have a description that starts with customization wording and states what it does not do", () => {
      expect(getCustomization.config.description).toMatch(
        /^Get the JavaScript and CSS customization settings of a kintone app/,
      );
      expect(getCustomization.config.description).toContain("Does NOT");
    });

    const inputSchema = z.object(getCustomization.config.inputSchema);

    describe("input schema validation with valid inputs", () => {
      it.each([
        { input: { app: "123" }, description: "app only" },
        {
          input: { app: "123", preview: true },
          description: "with preview true",
        },
        {
          input: { app: "123", preview: false },
          description: "with preview false",
        },
      ])("should accept valid input: $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).not.toThrow();
      });
    });

    describe("input schema validation with invalid inputs", () => {
      it.each([
        { input: {}, description: "missing app field" },
        { input: { app: 123 }, description: "app as number" },
        {
          input: { app: "123", preview: "true" },
          description: "preview as string",
        },
      ])("should reject invalid input: $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    it("should have valid output schema", () => {
      const schema = z.object(getCustomization.config.outputSchema);

      const validOutput = {
        scope: "ALL",
        desktop: { js: [urlResource, fileResource], css: [] },
        mobile: { js: [], css: [urlResource] },
        revision: "3",
      };
      expect(() => schema.parse(validOutput)).not.toThrow();
      expect(() =>
        schema.parse({
          ...validOutput,
          permissions: [{ permission: "APP_RECORD_READ" }],
          allowedHosts: ["example.com"],
        }),
      ).not.toThrow();

      expect(() => schema.parse({ scope: "ALL" })).toThrow();
      expect(() =>
        schema.parse({ ...validOutput, scope: "INVALID" }),
      ).toThrow();
      expect(() =>
        schema.parse({
          ...validOutput,
          desktop: { js: [{ type: "OTHER" }], css: [] },
        }),
      ).toThrow();
      expect(() =>
        schema.parse({
          ...validOutput,
          desktop: { js: [{ type: "URL" }], css: [] },
        }),
      ).toThrow();
      expect(() =>
        schema.parse({
          ...validOutput,
          desktop: {
            js: [{ type: "FILE", url: "https://example.com/customize.js" }],
            css: [],
          },
        }),
      ).toThrow();
    });
  });

  describe("callback function", () => {
    const inputSchema = z.object(getCustomization.config.inputSchema);

    const run = async (input: { app: string; preview?: boolean }) => {
      const mockClient = createMockClient();
      mockClient.app.getAppCustomize = mockGetAppCustomize;
      return getCustomization.callback(inputSchema.parse(input), {
        client: mockClient,
      });
    };

    it("should retrieve customization with mixed URL and FILE resources", async () => {
      const data = {
        scope: "ALL",
        desktop: { js: [urlResource, fileResource], css: [urlResource] },
        mobile: { js: [fileResource], css: [fileResource, urlResource] },
        revision: "5",
      };
      mockGetAppCustomize.mockResolvedValueOnce(data);

      const result = await run({ app: "123" });

      expect(mockGetAppCustomize).toHaveBeenCalledWith({
        app: "123",
        preview: undefined,
      });
      expect(result.structuredContent).toEqual(data);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(data, null, 2),
      });
    });

    it("should pass the preview parameter", async () => {
      mockGetAppCustomize.mockResolvedValueOnce({
        scope: "ADMIN",
        desktop: { js: [], css: [] },
        mobile: { js: [], css: [] },
        revision: "2",
      });

      await run({ app: "456", preview: true });

      expect(mockGetAppCustomize).toHaveBeenCalledWith({
        app: "456",
        preview: true,
      });
    });

    it("should return empty arrays with scope NONE without losing fields", async () => {
      const data = {
        scope: "NONE",
        desktop: { js: [], css: [] },
        mobile: { js: [], css: [] },
        revision: "1",
      };
      mockGetAppCustomize.mockResolvedValueOnce(data);

      const result = await run({ app: "123" });

      expect(result.structuredContent).toEqual(data);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(data, null, 2),
      });
    });

    it("should include permissions and allowedHosts when present", async () => {
      const data = {
        scope: "ALL",
        desktop: { js: [urlResource], css: [] },
        mobile: { js: [], css: [] },
        permissions: [{ permission: "APP_RECORD_READ" }],
        allowedHosts: ["example.com", "api.example.com"],
        revision: "7",
      };
      mockGetAppCustomize.mockResolvedValueOnce(data);

      const result = await run({ app: "123" });

      expect(result.structuredContent).toEqual(data);
    });

    it("should omit permissions and allowedHosts keys when absent", async () => {
      mockGetAppCustomize.mockResolvedValueOnce({
        scope: "ALL",
        desktop: { js: [urlResource], css: [] },
        mobile: { js: [], css: [] },
        revision: "7",
      });

      const result = await run({ app: "123" });

      expect(result.structuredContent).not.toHaveProperty("permissions");
      expect(result.structuredContent).not.toHaveProperty("allowedHosts");
    });

    it("should not leak fields outside the output schema", async () => {
      mockGetAppCustomize.mockResolvedValueOnce({
        scope: "ALL",
        desktop: { js: [], css: [] },
        mobile: { js: [], css: [] },
        revision: "1",
        extra: "value",
      });

      const result = await run({ app: "123" });

      expect(result.structuredContent).not.toHaveProperty("extra");
    });

    it("should handle API errors", async () => {
      const errorMessage = "API Error";
      mockGetAppCustomize.mockRejectedValueOnce(new Error(errorMessage));

      await expect(run({ app: "123" })).rejects.toThrow(errorMessage);
    });
  });
});
