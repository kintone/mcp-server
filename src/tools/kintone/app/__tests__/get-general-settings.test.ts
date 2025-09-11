import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getGeneralSettings } from "../get-general-settings.js";
import { z } from "zod";
import { createMockClient } from "../../../../__tests__/utils.js";

// Mock function for getAppSettings API call
const mockGetAppSettings = vi.fn();

describe("get-general-settings tool", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Set up environment variables for testing
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
      expect(getGeneralSettings.name).toBe("kintone-get-general-settings");
    });

    it("should have correct description", () => {
      expect(getGeneralSettings.config.description).toBe(
        "Get general settings of a kintone app",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(getGeneralSettings.config.inputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        { input: { app: "123" }, description: "app only" },
        { input: { app: "123", lang: "ja" }, description: "with lang ja" },
        { input: { app: "123", lang: "en" }, description: "with lang en" },
        { input: { app: "123", lang: "zh" }, description: "with lang zh" },
        {
          input: { app: "123", lang: "default" },
          description: "with lang default",
        },
        { input: { app: "123", lang: "user" }, description: "with lang user" },
      ])("should accept valid input: $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).not.toThrow();
      });
    });

    describe("input schema validation with invalid inputs", () => {
      it.each([
        { input: {}, description: "missing app field" },
        { input: { app: 123 }, description: "app as number" },
        {
          input: { app: "123", lang: "invalid" },
          description: "invalid lang value",
        },
        { input: { app: "123", lang: 123 }, description: "lang as number" },
      ])("should reject invalid input: $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    it("should have valid output schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getGeneralSettings.config.outputSchema!);

      // Valid output
      const validOutput = {
        name: "Sales App",
        description: "App for managing sales",
        icon: {
          type: "PRESET",
          key: "APP64",
        },
        theme: "RED",
        titleField: {
          selectionMode: "MANUAL",
          code: "文字列1行_0",
        },
        enableThumbnails: true,
        enableBulkDeletion: false,
        enableComments: true,
        enableDuplicateRecord: true,
        enableInlineRecordEditing: false,
        numberPrecision: {
          digits: 2,
          decimalPlaces: 2,
          roundingMode: "HALF_EVEN",
        },
        firstMonthOfFiscalYear: 4,
        revision: "5",
      };
      expect(() => schema.parse(validOutput)).not.toThrow();

      // Valid output with FILE icon
      const validOutputWithFileIcon = {
        ...validOutput,
        icon: {
          type: "FILE",
          key: "file123",
          file: {
            contentType: "image/png",
            fileKey: "fileKey123",
            name: "icon.png",
            size: "1024",
          },
        },
      };
      expect(() => schema.parse(validOutputWithFileIcon)).not.toThrow();

      // Invalid output - missing required fields
      expect(() => schema.parse({ name: "App" })).toThrow();

      // Invalid theme
      expect(() =>
        schema.parse({ ...validOutput, theme: "INVALID" }),
      ).toThrow();
    });
  });

  describe("callback function", () => {
    it("should retrieve general settings for the specified app", async () => {
      const mockSettingsData = {
        name: "Sales App",
        description: "App for managing sales",
        icon: {
          type: "PRESET",
          key: "APP64",
        },
        theme: "RED",
        titleField: {
          selectionMode: "MANUAL",
          code: "文字列1行_0",
        },
        enableThumbnails: true,
        enableBulkDeletion: false,
        enableComments: true,
        enableDuplicateRecord: true,
        enableInlineRecordEditing: false,
        numberPrecision: {
          digits: 2,
          decimalPlaces: 2,
          roundingMode: "HALF_EVEN",
        },
        firstMonthOfFiscalYear: 4,
        revision: "5",
      };

      mockGetAppSettings.mockResolvedValueOnce(mockSettingsData);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getGeneralSettings.config.inputSchema!);
      const params = schema.parse({
        app: "123",
      });

      const mockClient = createMockClient();
      mockClient.app.getAppSettings = mockGetAppSettings;

      const result = await getGeneralSettings.callback(params, {
        client: mockClient,
      });

      expect(mockGetAppSettings).toHaveBeenCalledWith({
        app: "123",
      });
      expect(result.structuredContent).toEqual(mockSettingsData);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockSettingsData, null, 2),
      });
    });

    it("should handle optional lang parameter", async () => {
      const mockSettingsData = {
        name: "営業アプリ",
        description: "営業管理用アプリ",
        icon: {
          type: "PRESET",
          key: "APP64",
        },
        theme: "RED",
        titleField: {
          selectionMode: "AUTO",
        },
        enableThumbnails: true,
        enableBulkDeletion: true,
        enableComments: true,
        enableDuplicateRecord: false,
        enableInlineRecordEditing: true,
        numberPrecision: {
          digits: 10,
          decimalPlaces: 5,
          roundingMode: "UP",
        },
        firstMonthOfFiscalYear: 1,
        revision: "5",
      };

      mockGetAppSettings.mockResolvedValueOnce(mockSettingsData);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getGeneralSettings.config.inputSchema!);
      const params = schema.parse({
        app: "123",
        lang: "ja",
      });

      const mockClient = createMockClient();
      mockClient.app.getAppSettings = mockGetAppSettings;

      const result = await getGeneralSettings.callback(params, {
        client: mockClient,
      });

      expect(mockGetAppSettings).toHaveBeenCalledWith({
        app: "123",
        lang: "ja",
      });
      expect(result.structuredContent?.name).toBe("営業アプリ");
      expect(result.structuredContent?.description).toBe("営業管理用アプリ");
    });
  });
});
