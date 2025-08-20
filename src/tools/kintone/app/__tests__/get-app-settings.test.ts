import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAppSettings } from "../get-app-settings.js";
import { z } from "zod";
import { mockExtra, mockKintoneConfig } from "../../../../__tests__/utils.js";

const mockGetAppSettings = vi.fn();

vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: vi.fn().mockImplementation(() => ({
    app: { getAppSettings: mockGetAppSettings },
  })),
}));

vi.mock("../../../../config.js", () => ({
  parseKintoneClientConfig: vi.fn().mockReturnValue({
    KINTONE_BASE_URL: "https://example.cybozu.com",
    KINTONE_USERNAME: "test-user",
    KINTONE_PASSWORD: "test-password",
  }),
  PACKAGE_NAME: "@kintone/mcp-server",
}));

vi.mock("../../../../version.js", () => ({
  version: "0.0.1",
}));

describe("get-app-settings tool", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Set up environment variables for testing
    process.env = {
      ...originalEnv,
      ...mockKintoneConfig,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("tool configuration", () => {
    it("should have correct name", () => {
      expect(getAppSettings.name).toBe("kintone-get-app-settings");
    });

    it("should have correct description", () => {
      expect(getAppSettings.config.description).toBe(
        "Get general settings from a kintone app",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(getAppSettings.config.inputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        { input: { app: 123 }, description: "app as number" },
        { input: { app: "123" }, description: "app as string" },
        { input: { app: 456, lang: "ja" }, description: "with lang ja" },
        { input: { app: 456, lang: "en" }, description: "with lang en" },
        { input: { app: 456, lang: "zh" }, description: "with lang zh" },
        {
          input: { app: 456, lang: "default" },
          description: "with lang default",
        },
        { input: { app: 456, lang: "user" }, description: "with lang user" },
      ])("accepts $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).not.toThrow();
      });
    });

    describe("input schema validation with invalid inputs", () => {
      it.each([
        { input: {}, description: "missing required app field" },
        { input: { app: true }, description: "app as boolean" },
        { input: { app: null }, description: "app as null" },
        { input: { app: [] }, description: "app as array" },
        { input: { app: 123, lang: 123 }, description: "lang as number" },
        { input: { app: 123, lang: "fr" }, description: "invalid lang value" },
        { input: { app: 123, lang: null }, description: "lang as null" },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputSchema = z.object(getAppSettings.config.outputSchema!);

    describe("output schema validation with valid outputs", () => {
      it.each([
        {
          output: {
            name: "Test App",
            description: "A test application",
            icon: {
              type: "PRESET",
              key: "APP72",
            },
            theme: "WHITE",
            revision: "5",
          },
          description: "complete app settings",
        },
        {
          output: {
            name: "Another App",
            description: "",
            icon: {
              type: "FILE",
              key: "some-file-key",
            },
            theme: "RED",
            revision: "1",
          },
          description: "app with empty description and file icon",
        },
      ])("accepts $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).not.toThrow();
      });
    });

    describe("output schema validation with invalid outputs", () => {
      it.each([
        {
          output: {},
          description: "missing all required fields",
        },
        {
          output: {
            name: "Test App",
            description: "A test application",
            icon: {
              type: "PRESET",
              key: "APP72",
            },
            theme: "WHITE",
          },
          description: "missing revision field",
        },
        {
          output: {
            name: 123,
            description: "A test application",
            icon: {
              type: "PRESET",
              key: "APP72",
            },
            theme: "WHITE",
            revision: "5",
          },
          description: "name as number instead of string",
        },
        {
          output: {
            name: "Test App",
            description: "A test application",
            icon: "invalid",
            theme: "WHITE",
            revision: "5",
          },
          description: "icon as string instead of object",
        },
        {
          output: {
            name: "Test App",
            description: "A test application",
            icon: {
              type: "PRESET",
            },
            theme: "WHITE",
            revision: "5",
          },
          description: "icon missing key field",
        },
      ])("rejects $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).toThrow();
      });
    });
  });

  describe("callback function", () => {
    it("should call API and return formatted response without lang", async () => {
      const mockData = {
        name: "Test Application",
        description: "This is a test app",
        icon: {
          type: "PRESET",
          key: "APP72",
        },
        theme: "WHITE",
        revision: "3",
      };

      mockGetAppSettings.mockResolvedValueOnce(mockData);

      const result = await getAppSettings.callback({ app: 123 }, mockExtra);

      expect(mockGetAppSettings).toHaveBeenCalledWith({
        app: 123,
        lang: undefined,
      });
      expect(result.structuredContent).toEqual({
        name: mockData.name,
        description: mockData.description,
        icon: mockData.icon,
        theme: mockData.theme,
        revision: mockData.revision,
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(
          {
            name: mockData.name,
            description: mockData.description,
            icon: mockData.icon,
            theme: mockData.theme,
            revision: mockData.revision,
          },
          null,
          2,
        ),
      });
    });

    it("should call API and return formatted response with lang", async () => {
      const mockData = {
        name: "テストアプリ",
        description: "これはテストアプリです",
        icon: {
          type: "FILE",
          key: "custom-icon-key",
        },
        theme: "BLUE",
        revision: "7",
      };

      mockGetAppSettings.mockResolvedValueOnce(mockData);

      const result = await getAppSettings.callback(
        { app: "456", lang: "ja" },
        mockExtra,
      );

      expect(mockGetAppSettings).toHaveBeenCalledWith({
        app: "456",
        lang: "ja",
      });
      expect(result.structuredContent).toEqual({
        name: mockData.name,
        description: mockData.description,
        icon: mockData.icon,
        theme: mockData.theme,
        revision: mockData.revision,
      });
    });
  });
});
