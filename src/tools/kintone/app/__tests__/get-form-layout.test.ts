import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getFormLayout } from "../get-form-layout.js";
import { z } from "zod";
import {
  mockKintoneConfig,
  mockToolCallbackOptions,
} from "../../../../__tests__/utils.js";

// Mock the KintoneRestAPIClient
const mockGetFormLayout = vi.fn();
vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: vi.fn().mockImplementation(() => ({
    app: {
      getFormLayout: mockGetFormLayout,
    },
  })),
}));

describe("get-form-layout tool", () => {
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
      expect(getFormLayout.name).toBe("kintone-get-form-layout");
    });

    it("should have correct description", () => {
      expect(getFormLayout.config.description).toBe(
        "Get form layout from a kintone app",
      );
    });

    const inputSchema = z.object(getFormLayout.config.inputSchema);

    describe("input schema validation with valid inputs", () => {
      it.each([
        { input: { app: "123" }, description: "app as string" },
        { input: { app: "456" }, description: "another app ID" },
        {
          input: { app: "123", preview: true },
          description: "app with preview true",
        },
        {
          input: { app: "123", preview: false },
          description: "app with preview false",
        },
      ])("accepts $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).not.toThrow();
      });
    });

    describe("input schema validation with invalid inputs", () => {
      it.each([
        { input: {}, description: "missing required app field" },
        { input: { app: 123 }, description: "app as number" },
        { input: { app: true }, description: "app as boolean" },
        { input: { app: null }, description: "app as null" },
        { input: { app: [] }, description: "app as array" },
        { input: { app: {} }, description: "app as object" },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    const outputSchema = z.object(getFormLayout.config.outputSchema);

    describe("output schema validation with valid outputs", () => {
      it.each([
        {
          output: {
            layout: [
              {
                type: "ROW",
                fields: [
                  {
                    type: "SINGLE_LINE_TEXT",
                    code: "text_field",
                    size: { width: "200" },
                  },
                ],
              },
            ],
            revision: "1",
          },
          description: "basic ROW layout",
        },
        {
          output: {
            layout: [
              {
                type: "SUBTABLE",
                code: "subtable_1",
                fields: [
                  {
                    type: "SINGLE_LINE_TEXT",
                    code: "sub_field",
                    size: { width: "150" },
                  },
                ],
              },
            ],
            revision: "2",
          },
          description: "SUBTABLE layout",
        },
        {
          output: {
            layout: [
              {
                type: "GROUP",
                code: "group_1",
                layout: [
                  {
                    type: "ROW",
                    fields: [
                      {
                        type: "NUMBER",
                        code: "number_field",
                        size: { width: "100" },
                      },
                    ],
                  },
                ],
              },
            ],
            revision: "3",
          },
          description: "GROUP layout",
        },
        {
          output: {
            layout: [],
            revision: "1",
          },
          description: "empty layout",
        },
        {
          output: {
            layout: [
              {
                type: "ROW",
                fields: [
                  {
                    type: "LABEL",
                    label: "ラベルテキスト",
                    size: { width: "200" },
                  },
                  {
                    type: "SPACER",
                    elementId: "spacer_1",
                    size: { width: "100", height: "50" },
                  },
                  {
                    type: "HR",
                    size: { width: "400" },
                  },
                ],
              },
            ],
            revision: "4",
          },
          description: "special field types (LABEL, SPACER, HR)",
        },
        {
          output: {
            layout: [
              {
                type: "ROW",
                fields: [
                  {
                    type: "MULTI_LINE_TEXT",
                    code: "multi_text",
                    size: { width: "300", innerHeight: "150" },
                  },
                ],
              },
            ],
            revision: "5",
          },
          description: "MULTI_LINE_TEXT with innerHeight",
        },
        {
          output: {
            layout: [
              {
                type: "ROW",
                fields: [
                  {
                    type: "DATE",
                    code: "date_field",
                    size: { width: "150" },
                  },
                  {
                    type: "TIME",
                    code: "time_field",
                    size: { width: "100" },
                  },
                  {
                    type: "DATETIME",
                    code: "datetime_field",
                    size: { width: "200" },
                  },
                ],
              },
            ],
            revision: "6",
          },
          description: "date and time field types",
        },
        {
          output: {
            layout: [
              {
                type: "ROW",
                fields: [
                  {
                    type: "USER_SELECT",
                    code: "user_field",
                    size: { width: "200" },
                  },
                  {
                    type: "REFERENCE_TABLE",
                    code: "reference_field",
                    size: { width: "400" },
                  },
                ],
              },
            ],
            revision: "7",
          },
          description: "user and reference field types",
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
          output: { layout: [] },
          description: "missing revision field",
        },
        {
          output: { revision: "1" },
          description: "missing layout field",
        },
        {
          output: { layout: "invalid", revision: "1" },
          description: "layout not an array",
        },
        {
          output: {
            layout: [
              {
                type: "ROW",
                fields: [
                  {
                    type: "INVALID_FIELD_TYPE",
                    code: "test",
                    size: { width: "200" },
                  },
                ],
              },
            ],
            revision: "1",
          },
          description: "invalid field type",
        },
      ])("rejects $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).toThrow();
      });
    });
  });

  describe("callback function", () => {
    it("should call API and return formatted response", async () => {
      const mockData = {
        layout: [
          {
            type: "ROW",
            fields: [
              {
                type: "SINGLE_LINE_TEXT",
                code: "text_field",
                size: { width: "200" },
              },
            ],
          },
        ],
        revision: "1",
      };

      mockGetFormLayout.mockResolvedValueOnce(mockData);

      const mockClient = {
        app: {
          getFormLayout: mockGetFormLayout,
        },
      };

      const result = await getFormLayout.callback(
        { app: "123" },
        mockToolCallbackOptions(mockClient as any),
      );

      expect(mockGetFormLayout).toHaveBeenCalledWith({
        app: "123",
      });
      expect(result.structuredContent).toEqual(mockData);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockData, null, 2),
      });
    });

    it("should call preview API when preview is true", async () => {
      const mockData = {
        layout: [
          {
            type: "ROW",
            fields: [
              {
                type: "SINGLE_LINE_TEXT",
                code: "preview_field",
                size: { width: "300" },
              },
            ],
          },
        ],
        revision: "2",
      };

      mockGetFormLayout.mockResolvedValueOnce(mockData);

      const mockClient = {
        app: {
          getFormLayout: mockGetFormLayout,
        },
      };

      const result = await getFormLayout.callback(
        { app: "123", preview: true },
        mockToolCallbackOptions(mockClient as any),
      );

      expect(mockGetFormLayout).toHaveBeenCalledWith({
        app: "123",
        preview: true,
      });
      expect(result.structuredContent).toEqual(mockData);
    });

    it("should call production API when preview is false", async () => {
      const mockData = {
        layout: [],
        revision: "3",
      };

      mockGetFormLayout.mockResolvedValueOnce(mockData);

      const mockClient = {
        app: {
          getFormLayout: mockGetFormLayout,
        },
      };

      const result = await getFormLayout.callback(
        { app: "123", preview: false },
        mockToolCallbackOptions(mockClient as any),
      );

      expect(mockGetFormLayout).toHaveBeenCalledWith({
        app: "123",
        preview: false,
      });
      expect(result.structuredContent).toEqual(mockData);
    });
  });
});
