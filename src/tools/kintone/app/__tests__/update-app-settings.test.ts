import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { updateAppSettings } from "../update-app-settings.js";
import { z } from "zod";
import { mockExtra, mockKintoneConfig } from "../../../../__tests__/utils.js";

const mockUpdateAppSettings = vi.fn();

vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: vi.fn().mockImplementation(() => ({
    app: { updateAppSettings: mockUpdateAppSettings },
  })),
}));

vi.mock("../../../../config.js", () => ({
  parseKintoneClientConfig: vi.fn().mockReturnValue({
    config: {
      KINTONE_BASE_URL: "https://example.cybozu.com",
      KINTONE_USERNAME: "test-user",
      KINTONE_PASSWORD: "test-password",
      KINTONE_API_TOKEN: undefined,
      KINTONE_BASIC_AUTH_USERNAME: undefined,
      KINTONE_BASIC_AUTH_PASSWORD: undefined,
      HTTPS_PROXY: undefined,
      KINTONE_PFX_FILE_PATH: undefined,
      KINTONE_PFX_FILE_PASSWORD: undefined,
    },
    isApiTokenAuth: false,
  }),
  PACKAGE_NAME: "@kintone/mcp-server",
}));

vi.mock("../../../../version.js", () => ({
  version: "0.0.1",
}));

describe("update-app-settings tool", () => {
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
      expect(updateAppSettings.name).toBe("kintone-update-app-settings");
    });

    it("should have correct description", () => {
      expect(updateAppSettings.config.description).toBe(
        "Update general settings for a kintone app",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(updateAppSettings.config.inputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        { input: { app: "123" }, description: "app only as string" },
        {
          input: { app: "123", name: "Updated App Name" },
          description: "app with name",
        },
        {
          input: { app: "123", description: "Updated description" },
          description: "app with description",
        },
        {
          input: { app: "123", theme: "BLUE" },
          description: "app with theme",
        },
        {
          input: { app: "123", revision: "5" },
          description: "app with revision",
        },
        {
          input: {
            app: "456",
            name: "Complete Update",
            description: "Full update with all fields",
            theme: "RED",
            revision: "3",
          },
          description: "all optional fields provided",
        },
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
        { input: { app: 123 }, description: "app as number" },
        { input: { app: "123", name: 123 }, description: "name as number" },
        {
          input: { app: "123", description: true },
          description: "description as boolean",
        },
        { input: { app: "123", theme: 123 }, description: "theme as number" },
        {
          input: { app: "123", revision: 5 },
          description: "revision as number instead of string",
        },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputSchema = z.object(updateAppSettings.config.outputSchema!);

    describe("output schema validation with valid outputs", () => {
      it.each([
        {
          output: { revision: "1" },
          description: "basic revision",
        },
        {
          output: { revision: "10" },
          description: "higher revision number",
        },
      ])("accepts $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).not.toThrow();
      });
    });

    describe("output schema validation with invalid outputs", () => {
      it.each([
        {
          output: {},
          description: "missing revision field",
        },
        {
          output: { revision: 123 },
          description: "revision as number instead of string",
        },
        {
          output: { revision: null },
          description: "revision as null",
        },
      ])("rejects $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).toThrow();
      });
    });
  });

  describe("callback function", () => {
    it("should update app with name only", async () => {
      const mockResponse = { revision: "6" };
      mockUpdateAppSettings.mockResolvedValueOnce(mockResponse);

      const input = {
        app: 123,
        name: "Updated App Name",
      };

      const result = await updateAppSettings.callback(input, mockExtra);

      expect(mockUpdateAppSettings).toHaveBeenCalledWith({
        app: 123,
        name: "Updated App Name",
      });
      expect(result.structuredContent).toEqual(mockResponse);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockResponse, null, 2),
      });
    });

    it("should update app with all optional fields", async () => {
      const mockResponse = { revision: "8" };
      mockUpdateAppSettings.mockResolvedValueOnce(mockResponse);

      const input = {
        app: "456",
        name: "Completely Updated App",
        description: "This app has been fully updated",
        theme: "GREEN" as const,
        revision: "7",
      };

      const result = await updateAppSettings.callback(input, mockExtra);

      expect(mockUpdateAppSettings).toHaveBeenCalledWith({
        app: "456",
        name: "Completely Updated App",
        description: "This app has been fully updated",
        theme: "GREEN",
        revision: "7",
      });
      expect(result.structuredContent).toEqual(mockResponse);
    });

    it("should update app with only some fields", async () => {
      const mockResponse = { revision: "4" };
      mockUpdateAppSettings.mockResolvedValueOnce(mockResponse);

      const input = {
        app: 789,
        description: "Updated description only",
        theme: "YELLOW" as const,
      };

      const result = await updateAppSettings.callback(input, mockExtra);

      expect(mockUpdateAppSettings).toHaveBeenCalledWith({
        app: 789,
        description: "Updated description only",
        theme: "YELLOW",
      });
      expect(result.structuredContent).toEqual(mockResponse);
    });

    it("should update app with app only (no optional fields)", async () => {
      const mockResponse = { revision: "2" };
      mockUpdateAppSettings.mockResolvedValueOnce(mockResponse);

      const input = {
        app: 999,
      };

      const result = await updateAppSettings.callback(input, mockExtra);

      expect(mockUpdateAppSettings).toHaveBeenCalledWith({
        app: 999,
      });
      expect(result.structuredContent).toEqual(mockResponse);
    });
  });
});
