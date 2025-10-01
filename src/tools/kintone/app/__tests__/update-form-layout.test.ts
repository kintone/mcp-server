import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { updateFormLayout } from "../update-form-layout.js";
import { z } from "zod";
import {
  createMockClient,
  mockKintoneConfig,
} from "../../../../__tests__/utils.js";

// Mock function for updateFormLayout API call
const mockUpdateFormLayout = vi.fn();

describe("update-form-layout tool", () => {
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
      expect(updateFormLayout.name).toBe("kintone-update-form-layout");
    });

    it("should have correct description", () => {
      expect(updateFormLayout.config.description).toBe(
        "Update form layout settings in a kintone app (preview environment only). " +
          "Use kintone-get-form-fields and kintone-get-form-layout first to understand current structure. " +
          "Field codes are case-sensitive and must match exactly. " +
          "For SUBTABLE fields, use nested structure: {type: 'SUBTABLE', code: 'table_code', fields: [{type: 'field_type', code: 'field_code'}, ...]}. " +
          "Required when adding new fields to ensure proper positioning. " +
          "Changes require kintone-deploy-app to apply to live app.",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(updateFormLayout.config.inputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        {
          input: { app: "123", layout: [] },
          description: "minimal valid input",
        },
        {
          input: {
            app: "456",
            layout: [
              {
                type: "ROW",
                fields: [
                  {
                    type: "SINGLE_LINE_TEXT",
                    code: "field1",
                    size: { width: "200" },
                  },
                ],
              },
            ],
          },
          description: "with single row layout",
        },
        {
          input: {
            app: "789",
            layout: [
              {
                type: "ROW",
                fields: [
                  {
                    type: "NUMBER",
                    code: "number_field",
                    size: { width: "150" },
                  },
                ],
              },
            ],
            revision: "5",
          },
          description: "with revision and number field",
        },
        {
          input: {
            app: "101",
            layout: [
              {
                type: "SUBTABLE",
                code: "subtable1",
                fields: [
                  {
                    type: "SINGLE_LINE_TEXT",
                    code: "sub_field1",
                    size: { width: "100" },
                  },
                ],
              },
            ],
          },
          description: "with subtable layout",
        },
        {
          input: {
            app: "102",
            layout: [
              {
                type: "GROUP",
                code: "group1",
                layout: [
                  {
                    type: "ROW",
                    fields: [
                      {
                        type: "LABEL",
                        label: "Group Label",
                        size: { width: "200" },
                      },
                    ],
                  },
                ],
              },
            ],
          },
          description: "with group layout",
        },
        {
          input: {
            app: "103",
            layout: [
              {
                type: "ROW",
                fields: [
                  {
                    type: "SPACER",
                    elementId: "spacer1",
                    size: { width: "50", height: "20" },
                  },
                ],
              },
            ],
          },
          description: "with spacer field",
        },
        {
          input: {
            app: "104",
            layout: [
              {
                type: "ROW",
                fields: [
                  {
                    type: "HR",
                    size: { width: "100%" },
                  },
                ],
              },
            ],
          },
          description: "with horizontal rule",
        },
      ])("accepts $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).not.toThrow();
      });
    });

    describe("input schema validation with invalid inputs", () => {
      it.each([
        { input: {}, description: "missing required fields" },
        { input: { app: "123" }, description: "missing layout" },
        { input: { layout: [] }, description: "missing app" },
        { input: { app: 123, layout: [] }, description: "app as number" },
        { input: { app: null, layout: [] }, description: "app as null" },
        { input: { app: [], layout: [] }, description: "app as array" },
        { input: { app: true, layout: [] }, description: "app as boolean" },
        {
          input: { app: "123", layout: null },
          description: "layout as null",
        },
        {
          input: { app: "123", layout: "invalid" },
          description: "layout as string",
        },
        {
          input: { app: "123", layout: {}, revision: "1" },
          description: "layout as object",
        },
        {
          input: { app: "123", layout: [], revision: 123 },
          description: "revision as number",
        },
        {
          input: { app: "123", layout: [], revision: null },
          description: "revision as null",
        },
        {
          input: { app: "123", layout: [], revision: [] },
          description: "revision as array",
        },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputSchema = z.object(updateFormLayout.config.outputSchema!);

    describe("output schema validation with valid outputs", () => {
      it.each([
        { output: { revision: "1" }, description: "minimal valid revision" },
        { output: { revision: "100" }, description: "larger revision number" },
        { output: { revision: "999999" }, description: "very large revision" },
        { output: { revision: "0" }, description: "zero revision" },
      ])("accepts $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).not.toThrow();
      });
    });

    describe("output schema validation with invalid outputs", () => {
      it.each([
        { output: {}, description: "missing revision" },
        { output: { revision: 1 }, description: "revision as number" },
        { output: { revision: null }, description: "revision as null" },
        { output: { revision: true }, description: "revision as boolean" },
        { output: { revision: [] }, description: "revision as array" },
        { output: { revision: {} }, description: "revision as object" },
        {
          output: { revision: undefined },
          description: "revision as undefined",
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

      mockUpdateFormLayout.mockResolvedValueOnce(mockData);

      const mockClient = createMockClient();
      mockClient.app.updateFormLayout = mockUpdateFormLayout;

      const layout = [
        {
          type: "ROW" as const,
          fields: [
            {
              type: "SINGLE_LINE_TEXT" as const,
              code: "field1",
              size: { width: "200" },
            },
          ],
        },
      ];

      const result = await updateFormLayout.callback(
        {
          app: "123",
          layout,
        },
        { client: mockClient },
      );

      expect(mockUpdateFormLayout).toHaveBeenCalledWith({
        app: "123",
        layout,
      });
      expect(result.structuredContent).toEqual(mockData);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockData, null, 2),
      });
    });

    it("should call API with revision parameter", async () => {
      const mockData = {
        revision: "3",
      };

      mockUpdateFormLayout.mockResolvedValueOnce(mockData);

      const mockClient = createMockClient();
      mockClient.app.updateFormLayout = mockUpdateFormLayout;

      const layout = [
        {
          type: "SUBTABLE" as const,
          code: "subtable1",
          fields: [
            {
              type: "NUMBER" as const,
              code: "sub_number",
              size: { width: "120" },
            },
          ],
        },
      ];

      const result = await updateFormLayout.callback(
        {
          app: "123",
          layout,
          revision: "2",
        },
        { client: mockClient },
      );

      expect(mockUpdateFormLayout).toHaveBeenCalledWith({
        app: "123",
        layout,
        revision: "2",
      });
      expect(result.structuredContent).toEqual(mockData);
    });

    it("should handle complex nested layout", async () => {
      const mockData = {
        revision: "10",
      };

      mockUpdateFormLayout.mockResolvedValueOnce(mockData);

      const mockClient = createMockClient();
      mockClient.app.updateFormLayout = mockUpdateFormLayout;

      const complexLayout = [
        {
          type: "GROUP" as const,
          code: "group1",
          layout: [
            {
              type: "ROW" as const,
              fields: [
                {
                  type: "LABEL" as const,
                  label: "Group Title",
                  size: { width: "200" },
                },
              ],
            },
            {
              type: "ROW" as const,
              fields: [
                {
                  type: "SINGLE_LINE_TEXT" as const,
                  code: "text_in_group",
                  size: { width: "150" },
                },
                {
                  type: "SPACER" as const,
                  elementId: "spacer1",
                  size: { width: "50" },
                },
              ],
            },
          ],
        },
        {
          type: "ROW" as const,
          fields: [
            {
              type: "HR" as const,
              size: { width: "100%" },
            },
          ],
        },
      ];

      const result = await updateFormLayout.callback(
        {
          app: "456",
          layout: complexLayout,
        },
        { client: mockClient },
      );

      expect(mockUpdateFormLayout).toHaveBeenCalledWith({
        app: "456",
        layout: complexLayout,
      });
      expect(result.structuredContent).toEqual(mockData);
    });

    it("should handle empty layout", async () => {
      const mockData = {
        revision: "1",
      };

      mockUpdateFormLayout.mockResolvedValueOnce(mockData);

      const mockClient = createMockClient();
      mockClient.app.updateFormLayout = mockUpdateFormLayout;

      const result = await updateFormLayout.callback(
        {
          app: "111",
          layout: [],
        },
        { client: mockClient },
      );

      expect(mockUpdateFormLayout).toHaveBeenCalledWith({
        app: "111",
        layout: [],
      });
      expect(result.structuredContent).toEqual(mockData);
    });

    it("should handle multiple field types in a row", async () => {
      const mockData = {
        revision: "15",
      };

      mockUpdateFormLayout.mockResolvedValueOnce(mockData);

      const mockClient = createMockClient();
      mockClient.app.updateFormLayout = mockUpdateFormLayout;

      const multiFieldLayout = [
        {
          type: "ROW" as const,
          fields: [
            {
              type: "SINGLE_LINE_TEXT" as const,
              code: "text_field",
              size: { width: "150" },
            },
            {
              type: "NUMBER" as const,
              code: "number_field",
              size: { width: "100" },
            },
            {
              type: "DATE" as const,
              code: "date_field",
              size: { width: "120" },
            },
          ],
        },
        {
          type: "ROW" as const,
          fields: [
            {
              type: "CHECK_BOX" as const,
              code: "checkbox_field",
              size: { width: "200" },
            },
          ],
        },
      ];

      const result = await updateFormLayout.callback(
        {
          app: "999",
          layout: multiFieldLayout,
          revision: "14",
        },
        { client: mockClient },
      );

      expect(mockUpdateFormLayout).toHaveBeenCalledWith({
        app: "999",
        layout: multiFieldLayout,
        revision: "14",
      });
      expect(result.structuredContent).toEqual(mockData);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockData, null, 2),
      });
    });
  });
});
