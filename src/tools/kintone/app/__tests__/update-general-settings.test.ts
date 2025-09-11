import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { updateGeneralSettings } from "../update-general-settings.js";
import { z } from "zod";
import {
  createMockClient,
  mockKintoneConfig,
} from "../../../../__tests__/utils.js";

// Mock function for updateAppSettings API call
const mockUpdateAppSettings = vi.fn();

describe("update-general-settings tool", () => {
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
      expect(updateGeneralSettings.name).toBe(
        "kintone-update-general-settings",
      );
    });

    it("should have correct description", () => {
      expect(updateGeneralSettings.config.description).toBe(
        "Update the general settings of a kintone app",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(updateGeneralSettings.config.inputSchema!);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputSchema = z.object(updateGeneralSettings.config.outputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        {
          input: { app: "123" },
          description: "minimal required fields",
        },
        {
          input: {
            app: "123",
            name: "Updated App",
            description: "Updated description",
            theme: "BLUE" as const,
          },
          description: "basic string fields",
        },
        {
          input: {
            app: "123",
            icon: {
              type: "PRESET" as const,
              key: "APP72",
            },
          },
          description: "PRESET icon",
        },
        {
          input: {
            app: "123",
            icon: {
              type: "FILE" as const,
              file: {
                fileKey: "file123",
              },
            },
          },
          description: "FILE icon",
        },
        {
          input: {
            app: "123",
            titleField: {
              selectionMode: "AUTO" as const,
            },
          },
          description: "titleField AUTO mode",
        },
        {
          input: {
            app: "123",
            titleField: {
              selectionMode: "MANUAL" as const,
              code: "text_field",
            },
          },
          description: "titleField MANUAL mode with code",
        },
        {
          input: {
            app: "123",
            numberPrecision: {
              digits: "10",
              decimalPlaces: "2",
              roundingMode: "HALF_EVEN" as const,
            },
          },
          description: "numberPrecision object",
        },
        {
          input: {
            app: "123",
            enableThumbnails: true,
            enableComments: false,
            enableBulkDeletion: true,
            enableDuplicateRecord: false,
            enableInlineRecordEditing: true,
            firstMonthOfFiscalYear: "4",
            revision: "1",
          },
          description: "all boolean and string optional fields",
        },
      ])("accepts $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).not.toThrow();
      });
    });

    describe("input schema validation with invalid inputs", () => {
      it.each([
        {
          input: {},
          description: "missing required app field",
        },
        {
          input: { app: 123 },
          description: "app as number",
        },
        {
          input: { app: "123", name: "A".repeat(65) },
          description: "name exceeds max length",
        },
        {
          input: {
            app: "123",
            titleField: {
              selectionMode: "MANUAL",
              // missing code field
            },
          },
          description: "titleField MANUAL mode missing code",
        },
        {
          input: {
            app: "123",
            icon: {
              type: "PRESET",
              // missing key field
            },
          },
          description: "PRESET icon missing key",
        },
        {
          input: {
            app: "123",
            icon: {
              type: "FILE",
              // missing file field
            },
          },
          description: "FILE icon missing file",
        },
        {
          input: { app: "123", theme: "INVALID" },
          description: "invalid theme value",
        },
        {
          input: {
            app: "123",
            numberPrecision: {
              digits: "0",
            },
          },
          description: "numberPrecision digits below minimum",
        },
        {
          input: {
            app: "123",
            numberPrecision: {
              digits: "31",
            },
          },
          description: "numberPrecision digits above maximum",
        },
        {
          input: {
            app: "123",
            numberPrecision: {
              decimalPlaces: "-1",
            },
          },
          description: "numberPrecision decimalPlaces below minimum",
        },
        {
          input: {
            app: "123",
            numberPrecision: {
              decimalPlaces: "11",
            },
          },
          description: "numberPrecision decimalPlaces above maximum",
        },
        {
          input: {
            app: "123",
            numberPrecision: {
              digits: "abc",
            },
          },
          description: "numberPrecision digits as non-numeric string",
        },
        {
          input: {
            app: "123",
            numberPrecision: {
              decimalPlaces: "xyz",
            },
          },
          description: "numberPrecision decimalPlaces as non-numeric string",
        },
        {
          input: { app: "123", firstMonthOfFiscalYear: "0" },
          description: "firstMonthOfFiscalYear below minimum",
        },
        {
          input: { app: "123", firstMonthOfFiscalYear: "13" },
          description: "firstMonthOfFiscalYear above maximum",
        },
        {
          input: { app: "123", firstMonthOfFiscalYear: "January" },
          description: "firstMonthOfFiscalYear as non-numeric string",
        },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    describe("output schema validation with valid outputs", () => {
      it.each([
        {
          output: { revision: "1" },
          description: "revision string",
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
          description: "revision as number",
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
    it("should call API and return formatted response", async () => {
      const mockData = {
        revision: "2",
      };

      mockUpdateAppSettings.mockResolvedValueOnce(mockData);

      const mockClient = createMockClient();
      mockClient.app.updateAppSettings = mockUpdateAppSettings;

      const result = await updateGeneralSettings.callback(
        { app: "123", name: "Updated App" },
        { client: mockClient },
      );

      expect(mockUpdateAppSettings).toHaveBeenCalledWith({
        app: "123",
        name: "Updated App",
      });
      expect(result.structuredContent).toEqual(mockData);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockData, null, 2),
      });
    });

    it("should handle complex parameters", async () => {
      const mockData = {
        revision: "3",
      };

      mockUpdateAppSettings.mockResolvedValueOnce(mockData);

      const mockClient = createMockClient();
      mockClient.app.updateAppSettings = mockUpdateAppSettings;

      const params = {
        app: "123",
        name: "Updated App",
        description: "Updated description",
        icon: {
          type: "PRESET" as const,
          key: "APP72",
        },
        theme: "BLUE" as const,
        titleField: {
          selectionMode: "MANUAL" as const,
          code: "text_field",
        },
        enableThumbnails: true,
        enableComments: false,
        enableBulkDeletion: true,
        enableDuplicateRecord: false,
        enableInlineRecordEditing: true,
        numberPrecision: {
          digits: "10",
          decimalPlaces: "2",
          roundingMode: "HALF_EVEN" as const,
        },
        firstMonthOfFiscalYear: "4",
        revision: "1",
      };

      const result = await updateGeneralSettings.callback(params, {
        client: mockClient,
      });

      expect(mockUpdateAppSettings).toHaveBeenCalledWith(params);
      expect(result.structuredContent).toEqual(mockData);
    });
  });
});
