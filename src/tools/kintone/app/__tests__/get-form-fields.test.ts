import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getFormFields } from "../get-form-fields.js";
import { z } from "zod";
import {
  createMockClient,
  mockKintoneConfig,
} from "../../../../__tests__/utils.js";

// Mock function for getFormFields API call
const mockGetFormFields = vi.fn();

describe("get-form-fields tool", () => {
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
      expect(getFormFields.name).toBe("kintone-get-form-fields");
    });

    it("should have correct description", () => {
      expect(getFormFields.config.description).toBe(
        "Get form field settings from a kintone app. Returns detailed field information including type, code, label, and all configuration settings (required status, default values, validation rules, options for selection fields). Response includes 'properties' object with all fields and 'revision' string. Use this before add/update operations to understand current field structure. Supports both live and pre-live app settings retrieval.",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(getFormFields.config.inputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        { input: { app: "123" }, description: "app as string" },
        { input: { app: "456", lang: "ja" }, description: "with lang ja" },
        { input: { app: "456", lang: "en" }, description: "with lang en" },
        { input: { app: "456", lang: "zh" }, description: "with lang zh" },
        {
          input: { app: "456", lang: "default" },
          description: "with lang default",
        },
        { input: { app: "456", lang: "user" }, description: "with lang user" },
        {
          input: { app: "123", preview: true },
          description: "with preview true",
        },
        {
          input: { app: "123", preview: false },
          description: "with preview false",
        },
        {
          input: { app: "456", lang: "ja", preview: true },
          description: "with lang ja and preview true",
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
        { input: { app: "123", lang: 123 }, description: "lang as number" },
        {
          input: { app: "123", lang: "fr" },
          description: "invalid lang value",
        },
        { input: { app: "123", lang: null }, description: "lang as null" },
        {
          input: { app: "123", preview: "true" },
          description: "preview as string",
        },
        { input: { app: "123", preview: 1 }, description: "preview as number" },
        {
          input: { app: "123", preview: null },
          description: "preview as null",
        },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputSchema = z.object(getFormFields.config.outputSchema!);

    describe("output schema validation with valid outputs", () => {
      it.each([
        {
          output: {
            properties: {
              text_field: {
                type: "SINGLE_LINE_TEXT",
                code: "text_field",
                label: "Text Field",
                noLabel: false,
                required: true,
              },
            },
            revision: "1",
          },
          description: "basic text field",
        },
        {
          output: {
            properties: {
              category_field: {
                type: "CATEGORY",
                code: "category_field",
                label: "Category",
                enabled: false,
              },
            },
            revision: "1",
          },
          description: "field with enabled property",
        },
        {
          output: {
            properties: {
              radio_field: {
                type: "RADIO_BUTTON",
                code: "radio_field",
                label: "Radio Field",
                options: {
                  opt1: { label: "Option 1", index: "0" },
                },
                align: "HORIZONTAL",
              },
            },
            revision: "1",
          },
          description: "field with align property",
        },
        {
          output: {
            properties: {
              user_select: {
                type: "USER_SELECT",
                code: "user_select",
                label: "User Selection",
                entities: [{ type: "USER", code: "user1" }],
              },
            },
            revision: "1",
          },
          description: "field with entities property",
        },
        {
          output: { properties: {}, revision: "1" },
          description: "empty properties with revision",
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
          output: { properties: {} },
          description: "missing revision field",
        },
        {
          output: { revision: "1" },
          description: "missing properties field",
        },
        {
          output: {
            properties: {
              field_1: {
                type: "SINGLE_LINE_TEXT",
                // missing required fields
              },
            },
            revision: "1",
          },
          description: "field missing required code and label",
        },
        {
          output: {
            properties: {
              field_1: {
                type: "SINGLE_LINE_TEXT",
                code: "field_1",
                // missing required label
              },
            },
            revision: "1",
          },
          description: "field missing required label",
        },
      ])("rejects $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).toThrow();
      });
    });
  });

  describe("callback function", () => {
    it("should call API and return formatted response", async () => {
      const mockData = {
        properties: {
          field_1: {
            type: "SINGLE_LINE_TEXT",
            code: "field_1",
            label: "Text Field",
          },
        },
        revision: "1",
      };

      mockGetFormFields.mockResolvedValueOnce(mockData);

      const mockClient = createMockClient();
      mockClient.app.getFormFields = mockGetFormFields;

      const result = await getFormFields.callback(
        { app: "123", lang: "ja" },
        { client: mockClient },
      );

      expect(mockGetFormFields).toHaveBeenCalledWith({
        app: "123",
        lang: "ja",
      });
      expect(result.structuredContent).toEqual(mockData);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockData, null, 2),
      });
    });

    it("should call API with preview parameter", async () => {
      const mockData = {
        properties: {
          field_1: {
            type: "SINGLE_LINE_TEXT",
            code: "field_1",
            label: "Text Field",
          },
        },
        revision: "1",
      };

      mockGetFormFields.mockResolvedValueOnce(mockData);

      const mockClient = createMockClient();
      mockClient.app.getFormFields = mockGetFormFields;

      const result = await getFormFields.callback(
        { app: "123", lang: "ja", preview: true },
        { client: mockClient },
      );

      expect(mockGetFormFields).toHaveBeenCalledWith({
        app: "123",
        lang: "ja",
        preview: true,
      });
      expect(result.structuredContent).toEqual(mockData);
    });
  });
});
