import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { updateGeneralSettings } from "../update-general-settings.js";
import { z } from "zod";
import { createMockClient } from "../../../../__tests__/utils.js";

const mockUpdateAppSettings = vi.fn();

describe("update-general-settings tool", () => {
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
      expect(updateGeneralSettings.name).toBe(
        "kintone-update-general-settings",
      );
    });

    it("should have correct description", () => {
      expect(updateGeneralSettings.config.description).toBe(
        "Update the general settings of a kintone app",
      );
    });

    it("should have valid input schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(updateGeneralSettings.config.inputSchema!);

      const validInput = {
        app: "123",
        name: "Updated App",
      };
      expect(() => schema.parse(validInput)).not.toThrow();

      const validInputWithAllFields = {
        app: "123",
        name: "Updated App",
        description: "Updated description",
        icon: {
          type: "PRESET" as const,
          key: "APP72",
        },
        theme: "BLUE" as const,
        titleField: {
          type: "SINGLE_LINE_TEXT" as const,
          value: "text_field",
        },
        enableThumbnails: true,
        enableComments: false,
        numberPrecision: 2,
      };
      expect(() => schema.parse(validInputWithAllFields)).not.toThrow();

      expect(() => schema.parse({})).toThrow();

      expect(() =>
        schema.parse({
          app: "123",
          name: "A".repeat(65), // exceeds max length
        }),
      ).toThrow();

      expect(() =>
        schema.parse({
          app: "123",
          numberPrecision: 21, // exceeds max value
        }),
      ).toThrow();
    });

    it("should have valid output schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(updateGeneralSettings.config.outputSchema!);

      const validOutput = {
        revision: "2",
      };
      expect(() => schema.parse(validOutput)).not.toThrow();

      expect(() => schema.parse({})).toThrow();
    });
  });

  describe("callback function", () => {
    it("should update app settings successfully with minimal fields", async () => {
      const mockResponse = {
        revision: "2",
      };

      mockUpdateAppSettings.mockResolvedValueOnce(mockResponse);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(updateGeneralSettings.config.inputSchema!);
      const params = schema.parse({
        app: "123",
        name: "Updated App",
      });

      const mockClient = createMockClient();
      mockClient.app.updateAppSettings = mockUpdateAppSettings;

      const result = await updateGeneralSettings.callback(params, {
        client: mockClient,
      });

      expect(mockUpdateAppSettings).toHaveBeenCalledWith({
        app: "123",
        name: "Updated App",
      });
      expect(result.structuredContent).toEqual(mockResponse);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockResponse, null, 2),
      });
    });

    it("should update app settings with all optional fields", async () => {
      const mockResponse = {
        revision: "3",
      };

      mockUpdateAppSettings.mockResolvedValueOnce(mockResponse);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(updateGeneralSettings.config.inputSchema!);
      const params = schema.parse({
        app: "123",
        name: "Updated App",
        description: "Updated description",
        icon: {
          type: "PRESET" as const,
          key: "APP72",
        },
        theme: "BLUE" as const,
        titleField: {
          type: "SINGLE_LINE_TEXT" as const,
          value: "text_field",
        },
        enableThumbnails: true,
        enableComments: false,
        numberPrecision: 2,
      });

      const mockClient = createMockClient();
      mockClient.app.updateAppSettings = mockUpdateAppSettings;

      const result = await updateGeneralSettings.callback(params, {
        client: mockClient,
      });

      expect(mockUpdateAppSettings).toHaveBeenCalledWith({
        app: "123",
        name: "Updated App",
        description: "Updated description",
        icon: {
          type: "PRESET",
          key: "APP72",
        },
        theme: "BLUE",
        titleField: {
          type: "SINGLE_LINE_TEXT",
          value: "text_field",
        },
        enableThumbnails: true,
        enableComments: false,
        numberPrecision: 2,
      });
      expect(result.structuredContent).toEqual(mockResponse);
    });

    it("should handle FILE type icon", async () => {
      const mockResponse = {
        revision: "3",
      };

      mockUpdateAppSettings.mockResolvedValueOnce(mockResponse);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(updateGeneralSettings.config.inputSchema!);
      const params = schema.parse({
        app: "123",
        icon: {
          type: "FILE" as const,
          file: {
            fileKey: "file123",
          },
        },
      });

      const mockClient = createMockClient();
      mockClient.app.updateAppSettings = mockUpdateAppSettings;

      const result = await updateGeneralSettings.callback(params, {
        client: mockClient,
      });

      expect(mockUpdateAppSettings).toHaveBeenCalledWith({
        app: "123",
        icon: {
          type: "FILE",
          file: {
            fileKey: "file123",
          },
        },
      });
      expect(result.structuredContent).toEqual(mockResponse);
    });
  });
});
