import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { updateFormFields } from "../update-form-fields.js";
import { z } from "zod";
import {
  createMockClient,
  mockKintoneConfig,
} from "../../../../__tests__/utils.js";

// Mock function for updateFormFields API call
const mockUpdateFormFields = vi.fn();

describe("update-form-fields tool", () => {
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
      expect(updateFormFields.name).toBe("kintone-update-form-fields");
    });

    it("should have correct description", () => {
      expect(updateFormFields.config.description).toBe(
        "Update form field settings in a kintone app (preview environment only). Requires App Management permissions. Cannot update field codes for Label, Blank space, Border, Status, Assignee, or Category fields. For selection fields, unspecified options will be deleted. Option keys must exactly match current option names. New options require 'label' and 'index'. Field codes: max 128 chars, cannot start with numbers, only '_' symbol allowed. Duplicate field codes not allowed. Use kintone-get-form-fields first to check current settings. Changes require kintone-deploy-app to apply to live app.",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(updateFormFields.config.inputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        {
          input: { app: "123", properties: {} },
          description: "minimal valid input",
        },
        {
          input: {
            app: "456",
            properties: {
              field1: {
                type: "SINGLE_LINE_TEXT",
                code: "field1",
                label: "Field 1",
              },
            },
          },
          description: "with single text field",
        },
        {
          input: {
            app: "789",
            properties: {
              field1: {
                type: "NUMBER",
                code: "field1",
                label: "Number Field",
                minValue: "0",
                maxValue: "100",
                required: true,
                unique: false,
              },
            },
            revision: "5",
          },
          description: "with revision and number field",
        },
        {
          input: {
            app: "101",
            properties: {
              dropdown: {
                type: "DROP_DOWN",
                code: "dropdown",
                label: "Dropdown Field",
                options: {
                  opt1: { label: "Option 1", index: "0" },
                  opt2: { label: "Option 2", index: "1" },
                },
              },
            },
          },
          description: "with dropdown field and options",
        },
        {
          input: {
            app: "102",
            properties: {
              radio: {
                type: "RADIO_BUTTON",
                code: "radio",
                label: "Radio Field",
                options: {
                  yes: { label: "Yes", index: "0" },
                  no: { label: "No", index: "1" },
                },
                align: "HORIZONTAL",
                defaultValue: "yes",
              },
            },
          },
          description: "with radio button field",
        },
        {
          input: {
            app: "103",
            properties: {
              calc: {
                type: "CALC",
                code: "calc",
                label: "Calculation",
                expression: "field1 + field2",
                format: "NUMBER",
                hideExpression: false,
              },
            },
          },
          description: "with calculation field",
        },
        {
          input: {
            app: "104",
            properties: {
              userSelect: {
                type: "USER_SELECT",
                code: "userSelect",
                label: "User Selection",
                entities: [
                  { type: "USER", code: "user1" },
                  { type: "GROUP", code: "group1" },
                ],
              },
            },
          },
          description: "with user selection field",
        },
        {
          input: {
            app: "105",
            properties: {
              multiField: {
                type: "MULTI_LINE_TEXT",
                code: "multiField",
                label: "Multi Line Text",
                defaultValue: "Default\nText",
                maxLength: "1000",
              },
            },
            revision: "10",
          },
          description: "with multi-line text field and revision",
        },
      ])("accepts $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).not.toThrow();
      });
    });

    describe("input schema validation with invalid inputs", () => {
      it.each([
        { input: {}, description: "missing required fields" },
        { input: { app: "123" }, description: "missing properties" },
        { input: { properties: {} }, description: "missing app" },
        { input: { app: 123, properties: {} }, description: "app as number" },
        { input: { app: null, properties: {} }, description: "app as null" },
        { input: { app: [], properties: {} }, description: "app as array" },
        { input: { app: true, properties: {} }, description: "app as boolean" },
        {
          input: { app: "123", properties: null },
          description: "properties as null",
        },
        {
          input: { app: "123", properties: "invalid" },
          description: "properties as string",
        },
        {
          input: { app: "123", properties: [], revision: "1" },
          description: "properties as array",
        },
        {
          input: { app: "123", properties: {}, revision: 123 },
          description: "revision as number",
        },
        {
          input: { app: "123", properties: {}, revision: null },
          description: "revision as null",
        },
        {
          input: { app: "123", properties: {}, revision: [] },
          description: "revision as array",
        },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputSchema = z.object(updateFormFields.config.outputSchema!);

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

      mockUpdateFormFields.mockResolvedValueOnce(mockData);

      const mockClient = createMockClient();
      mockClient.app.updateFormFields = mockUpdateFormFields;

      const result = await updateFormFields.callback(
        {
          app: "123",
          properties: {
            field1: {
              type: "SINGLE_LINE_TEXT",
              code: "field1",
              label: "Updated Label",
            },
          },
        },
        { client: mockClient },
      );

      expect(mockUpdateFormFields).toHaveBeenCalledWith({
        app: "123",
        properties: {
          field1: {
            type: "SINGLE_LINE_TEXT",
            code: "field1",
            label: "Updated Label",
          },
        },
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

      mockUpdateFormFields.mockResolvedValueOnce(mockData);

      const mockClient = createMockClient();
      mockClient.app.updateFormFields = mockUpdateFormFields;

      const result = await updateFormFields.callback(
        {
          app: "123",
          properties: {
            field1: {
              type: "NUMBER",
              code: "field1",
              label: "Number Field",
              minValue: "0",
              maxValue: "100",
            },
          },
          revision: "2",
        },
        { client: mockClient },
      );

      expect(mockUpdateFormFields).toHaveBeenCalledWith({
        app: "123",
        properties: {
          field1: {
            type: "NUMBER",
            code: "field1",
            label: "Number Field",
            minValue: "0",
            maxValue: "100",
          },
        },
        revision: "2",
      });
      expect(result.structuredContent).toEqual(mockData);
    });

    it("should handle complex field properties", async () => {
      const mockData = {
        revision: "10",
      };

      mockUpdateFormFields.mockResolvedValueOnce(mockData);

      const mockClient = createMockClient();
      mockClient.app.updateFormFields = mockUpdateFormFields;

      const complexProperties = {
        dropdown: {
          type: "DROP_DOWN",
          code: "dropdown",
          label: "Dropdown Field",
          options: {
            option1: { label: "Option 1", index: "0" },
            option2: { label: "Option 2", index: "1" },
          },
        },
        calc_field: {
          type: "CALC",
          code: "calc_field",
          label: "Calculation",
          expression: "field1 + field2",
          format: "NUMBER",
        },
      };

      const result = await updateFormFields.callback(
        {
          app: "456",
          properties: complexProperties,
        },
        { client: mockClient },
      );

      expect(mockUpdateFormFields).toHaveBeenCalledWith({
        app: "456",
        properties: complexProperties,
      });
      expect(result.structuredContent).toEqual(mockData);
    });

    it("should handle field with lookup configuration", async () => {
      const mockData = {
        revision: "15",
      };

      mockUpdateFormFields.mockResolvedValueOnce(mockData);

      const mockClient = createMockClient();
      mockClient.app.updateFormFields = mockUpdateFormFields;

      const lookupProperties = {
        lookup_field: {
          type: "SINGLE_LINE_TEXT",
          code: "lookup_field",
          label: "Lookup Field",
          lookup: {
            relatedApp: {
              app: "200",
              code: "related_app",
            },
            relatedKeyField: "key_field",
            fieldMappings: [
              {
                field: "lookup_field",
                relatedField: "source_field",
              },
            ],
            lookupPickerFields: ["display_field"],
            filterCond: 'status = "active"',
            sort: "created_time desc",
          },
        },
      };

      const result = await updateFormFields.callback(
        {
          app: "789",
          properties: lookupProperties,
          revision: "14",
        },
        { client: mockClient },
      );

      expect(mockUpdateFormFields).toHaveBeenCalledWith({
        app: "789",
        properties: lookupProperties,
        revision: "14",
      });
      expect(result.structuredContent).toEqual(mockData);
    });

    it("should handle multiple different field types", async () => {
      const mockData = {
        revision: "20",
      };

      mockUpdateFormFields.mockResolvedValueOnce(mockData);

      const mockClient = createMockClient();
      mockClient.app.updateFormFields = mockUpdateFormFields;

      const multipleFieldProperties = {
        text_field: {
          type: "SINGLE_LINE_TEXT",
          code: "text_field",
          label: "Text Field",
          required: true,
          unique: true,
          maxLength: "255",
          defaultValue: "default text",
        },
        number_field: {
          type: "NUMBER",
          code: "number_field",
          label: "Number Field",
          minValue: "0",
          maxValue: "9999",
          displayScale: "2",
          unit: "円",
          unitPosition: "AFTER" as const,
          digit: true,
        },
        date_field: {
          type: "DATE",
          code: "date_field",
          label: "Date Field",
          defaultNowValue: true,
        },
        checkbox: {
          type: "CHECK_BOX",
          code: "checkbox",
          label: "Checkbox Field",
          options: {
            item1: { label: "Item 1", index: "0" },
            item2: { label: "Item 2", index: "1" },
            item3: { label: "Item 3", index: "2" },
          },
          align: "VERTICAL" as const,
        },
      };

      const result = await updateFormFields.callback(
        {
          app: "999",
          properties: multipleFieldProperties,
        },
        { client: mockClient },
      );

      expect(mockUpdateFormFields).toHaveBeenCalledWith({
        app: "999",
        properties: multipleFieldProperties,
      });
      expect(result.structuredContent).toEqual(mockData);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockData, null, 2),
      });
    });

    it("should handle empty properties object", async () => {
      const mockData = {
        revision: "1",
      };

      mockUpdateFormFields.mockResolvedValueOnce(mockData);

      const mockClient = createMockClient();
      mockClient.app.updateFormFields = mockUpdateFormFields;

      const result = await updateFormFields.callback(
        {
          app: "111",
          properties: {},
        },
        { client: mockClient },
      );

      expect(mockUpdateFormFields).toHaveBeenCalledWith({
        app: "111",
        properties: {},
      });
      expect(result.structuredContent).toEqual(mockData);
    });

    it("should handle field with reference table configuration", async () => {
      const mockData = {
        revision: "25",
      };

      mockUpdateFormFields.mockResolvedValueOnce(mockData);

      const mockClient = createMockClient();
      mockClient.app.updateFormFields = mockUpdateFormFields;

      const referenceTableProperties = {
        reference_table: {
          type: "REFERENCE_TABLE",
          code: "reference_table",
          label: "Reference Table",
          referenceTable: {
            relatedApp: {
              app: "300",
              code: "reference_app",
            },
            condition: {
              field: "parent_id",
              relatedField: "record_id",
            },
            filterCond: 'status != "deleted"',
            displayFields: ["title", "description", "date"],
            sort: "date desc",
            size: "10",
          },
        },
      };

      const result = await updateFormFields.callback(
        {
          app: "888",
          properties: referenceTableProperties,
          revision: "24",
        },
        { client: mockClient },
      );

      expect(mockUpdateFormFields).toHaveBeenCalledWith({
        app: "888",
        properties: referenceTableProperties,
        revision: "24",
      });
      expect(result.structuredContent).toEqual(mockData);
    });
  });
});
