import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { addFormFields } from "../add-form-fields.js";
import { z } from "zod";
import {
  createMockClient,
  mockKintoneConfig,
} from "../../../../__tests__/utils.js";

const mockAddFormFields = vi.fn();

describe("add-form-fields tool", () => {
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
      expect(addFormFields.name).toBe("kintone-add-form-fields");
    });

    it("should have correct description", () => {
      expect(addFormFields.config.description).toBe(
        "Add new fields to a kintone app (preview environment only). Requires App Management permissions. Cannot add Status, Assignee, or Category fields. Field codes must be unique, max 128 chars, cannot start with numbers, and only '_' symbol allowed. For selection fields (DROP_DOWN/RADIO_BUTTON/CHECK_BOX/MULTI_SELECT), option keys must exactly match their label values. Options require 'label' and 'index' properties. Use kintone-get-form-fields first to check existing fields. Changes require kintone-deploy-app to apply to live app.",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(addFormFields.config.inputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        {
          input: {
            app: "123",
            properties: {
              textField: {
                type: "SINGLE_LINE_TEXT",
                code: "textField",
                label: "Text Field",
              },
            },
          },
          description: "basic text field",
        },
        {
          input: {
            app: "456",
            properties: {
              textField: {
                type: "SINGLE_LINE_TEXT",
                code: "textField",
                label: "Text Field",
                required: true,
                unique: false,
              },
            },
            revision: "2",
          },
          description: "text field with optional properties and revision",
        },
        {
          input: {
            app: "789",
            properties: {
              numberField: {
                type: "NUMBER",
                code: "numberField",
                label: "Number Field",
                minValue: "0",
                maxValue: "100",
                digit: true,
              },
            },
          },
          description: "number field with constraints",
        },
        {
          input: {
            app: "100",
            properties: {
              multiField1: {
                type: "SINGLE_LINE_TEXT",
                code: "multiField1",
                label: "Multi Field 1",
              },
              multiField2: {
                type: "NUMBER",
                code: "multiField2",
                label: "Multi Field 2",
              },
            },
          },
          description: "multiple fields",
        },
        {
          input: {
            app: "200",
            properties: {
              lookupField: {
                type: "SINGLE_LINE_TEXT",
                code: "lookupField",
                label: "Lookup Field",
                lookup: {
                  relatedApp: {
                    app: "10",
                    code: "",
                  },
                  relatedKeyField: "code",
                  fieldMappings: [
                    {
                      field: "name",
                      relatedField: "name",
                    },
                  ],
                  lookupPickerFields: ["code", "name"],
                },
              },
            },
          },
          description: "field with lookup settings",
        },
        {
          input: {
            app: "300",
            properties: {
              subtableField: {
                type: "SUBTABLE",
                code: "subtableField",
                label: "Subtable Field",
                fields: {
                  subText: {
                    type: "SINGLE_LINE_TEXT",
                    code: "subText",
                    label: "Sub Text",
                  },
                },
              },
            },
          },
          description: "subtable field",
        },
        {
          input: {
            app: "400",
            properties: {
              radioField: {
                type: "RADIO_BUTTON",
                code: "radioField",
                label: "Radio Field",
                options: {
                  opt1: { label: "Option 1", index: "0" },
                  opt2: { label: "Option 2", index: "1" },
                },
                align: "HORIZONTAL",
              },
            },
          },
          description: "radio button field with options",
        },
        {
          input: {
            app: "500",
            properties: {
              userSelectField: {
                type: "USER_SELECT",
                code: "userSelectField",
                label: "User Select Field",
                entities: [
                  { type: "USER", code: "user1" },
                  { type: "GROUP", code: "group1" },
                ],
              },
            },
          },
          description: "user select field with entities",
        },
      ])("accepts $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).not.toThrow();
      });
    });

    describe("input schema validation with invalid inputs", () => {
      it.each([
        {
          input: {},
          description: "missing all required fields",
        },
        {
          input: { app: "123" },
          description: "missing properties field",
        },
        {
          input: { properties: {} },
          description: "missing app field",
        },
        {
          input: { app: 123, properties: {} },
          description: "app as number",
        },
        {
          input: { app: "123", properties: "invalid" },
          description: "properties as string",
        },
        {
          input: {
            app: "123",
            properties: {
              invalidField: {
                // missing required properties
              },
            },
          },
          description: "field missing required type, code, and label",
        },
        {
          input: {
            app: "123",
            properties: {
              invalidField: {
                type: "SINGLE_LINE_TEXT",
                // missing code and label
              },
            },
          },
          description: "field missing required code and label",
        },
        {
          input: {
            app: "123",
            properties: {
              invalidField: {
                type: "SINGLE_LINE_TEXT",
                code: "invalidField",
                // missing label
              },
            },
          },
          description: "field missing required label",
        },
        {
          input: {
            app: "123",
            properties: {
              invalidField: {
                type: "SINGLE_LINE_TEXT",
                code: "invalidField",
                label: "Invalid Field",
                required: "true", // should be boolean
              },
            },
          },
          description: "invalid boolean property type",
        },
        {
          input: {
            app: "123",
            properties: {
              invalidField: {
                type: "SINGLE_LINE_TEXT",
                code: "invalidField",
                label: "Invalid Field",
                entities: "invalid", // should be array
              },
            },
          },
          description: "invalid entities property type",
        },
        {
          input: {
            app: "123",
            properties: {
              invalidField: {
                type: "SINGLE_LINE_TEXT",
                code: "invalidField",
                label: "Invalid Field",
                align: "INVALID", // should be HORIZONTAL or VERTICAL
              },
            },
          },
          description: "invalid align enum value",
        },
        {
          input: {
            app: "123",
            properties: {
              invalidField: {
                type: "SINGLE_LINE_TEXT",
                code: "invalidField",
                label: "Invalid Field",
              },
            },
            revision: 123, // should be string
          },
          description: "revision as number",
        },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputSchema = z.object(addFormFields.config.outputSchema!);

    describe("output schema validation with valid outputs", () => {
      it.each([
        {
          output: { revision: "1" },
          description: "basic revision",
        },
        {
          output: { revision: "123" },
          description: "numeric revision as string",
        },
        {
          output: { revision: "abc123" },
          description: "alphanumeric revision",
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
        {
          output: { revision: true },
          description: "revision as boolean",
        },
        {
          output: { revision: [] },
          description: "revision as array",
        },
      ])("rejects $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).toThrow();
      });
    });
  });

  describe("callback function", () => {
    it("should add a single text field to an app", async () => {
      mockAddFormFields.mockResolvedValue({
        revision: "3",
      });

      const mockClient = createMockClient();
      mockClient.app.addFormFields = mockAddFormFields;

      const result = await addFormFields.callback(
        {
          app: "123",
          properties: {
            myTextField: {
              type: "SINGLE_LINE_TEXT",
              code: "myTextField",
              label: "My Text Field",
            },
          },
        },
        { client: mockClient },
      );

      expect(mockAddFormFields).toHaveBeenCalledWith({
        app: "123",
        properties: {
          myTextField: {
            type: "SINGLE_LINE_TEXT",
            code: "myTextField",
            label: "My Text Field",
          },
        },
        revision: undefined,
      });

      expect(result.structuredContent).toEqual({
        revision: "3",
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify({ revision: "3" }, null, 2),
      });
    });

    it("should add multiple fields to an app with revision", async () => {
      mockAddFormFields.mockResolvedValue({
        revision: "4",
      });

      const mockClient = createMockClient();
      mockClient.app.addFormFields = mockAddFormFields;

      const result = await addFormFields.callback(
        {
          app: "456",
          properties: {
            textField: {
              type: "SINGLE_LINE_TEXT",
              code: "textField",
              label: "Text Field",
              required: true,
            },
            numberField: {
              type: "NUMBER",
              code: "numberField",
              label: "Number Field",
              minValue: "0",
              maxValue: "100",
            },
          },
          revision: "2",
        },
        { client: mockClient },
      );

      expect(mockAddFormFields).toHaveBeenCalledWith({
        app: "456",
        properties: {
          textField: {
            type: "SINGLE_LINE_TEXT",
            code: "textField",
            label: "Text Field",
            required: true,
          },
          numberField: {
            type: "NUMBER",
            code: "numberField",
            label: "Number Field",
            minValue: "0",
            maxValue: "100",
          },
        },
        revision: "2",
      });

      expect(result.structuredContent).toEqual({
        revision: "4",
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify({ revision: "4" }, null, 2),
      });
    });

    it("should add field with lookup settings", async () => {
      mockAddFormFields.mockResolvedValue({
        revision: "5",
      });

      const mockClient = createMockClient();
      mockClient.app.addFormFields = mockAddFormFields;

      const result = await addFormFields.callback(
        {
          app: "789",
          properties: {
            lookupField: {
              type: "SINGLE_LINE_TEXT",
              code: "lookupField",
              label: "Lookup Field",
              lookup: {
                relatedApp: {
                  app: "10",
                  code: "",
                },
                relatedKeyField: "code",
                fieldMappings: [
                  {
                    field: "name",
                    relatedField: "name",
                  },
                ],
                lookupPickerFields: ["code", "name"],
                filterCond: "",
                sort: "",
              },
            },
          },
        },
        { client: mockClient },
      );

      expect(mockAddFormFields).toHaveBeenCalledWith({
        app: "789",
        properties: {
          lookupField: {
            type: "SINGLE_LINE_TEXT",
            code: "lookupField",
            label: "Lookup Field",
            lookup: {
              relatedApp: {
                app: "10",
                code: "",
              },
              relatedKeyField: "code",
              fieldMappings: [
                {
                  field: "name",
                  relatedField: "name",
                },
              ],
              lookupPickerFields: ["code", "name"],
              filterCond: "",
              sort: "",
            },
          },
        },
        revision: undefined,
      });

      expect(result.structuredContent).toEqual({
        revision: "5",
      });
    });

    it("should add subtable with nested fields", async () => {
      mockAddFormFields.mockResolvedValue({
        revision: "6",
      });

      const mockClient = createMockClient();
      mockClient.app.addFormFields = mockAddFormFields;

      const result = await addFormFields.callback(
        {
          app: "111",
          properties: {
            mySubtable: {
              type: "SUBTABLE",
              code: "mySubtable",
              label: "My Subtable",
              fields: {
                subText: {
                  type: "SINGLE_LINE_TEXT",
                  code: "subText",
                  label: "Sub Text",
                  required: true,
                },
                subNumber: {
                  type: "NUMBER",
                  code: "subNumber",
                  label: "Sub Number",
                  digit: true,
                },
              },
            },
          },
        },
        { client: mockClient },
      );

      expect(mockAddFormFields).toHaveBeenCalledWith({
        app: "111",
        properties: {
          mySubtable: {
            type: "SUBTABLE",
            code: "mySubtable",
            label: "My Subtable",
            fields: {
              subText: {
                type: "SINGLE_LINE_TEXT",
                code: "subText",
                label: "Sub Text",
                required: true,
              },
              subNumber: {
                type: "NUMBER",
                code: "subNumber",
                label: "Sub Number",
                digit: true,
              },
            },
          },
        },
        revision: undefined,
      });

      expect(result.structuredContent).toEqual({
        revision: "6",
      });
    });

    it("should add field with complex properties", async () => {
      mockAddFormFields.mockResolvedValue({
        revision: "7",
      });

      const mockClient = createMockClient();
      mockClient.app.addFormFields = mockAddFormFields;

      const result = await addFormFields.callback(
        {
          app: "222",
          properties: {
            complexField: {
              type: "RADIO_BUTTON",
              code: "complexField",
              label: "Complex Field",
              required: true,
              options: {
                option1: { label: "Option 1", index: "0" },
                option2: { label: "Option 2", index: "1" },
              },
              align: "VERTICAL",
              defaultValue: "option1",
            },
          },
        },
        { client: mockClient },
      );

      expect(mockAddFormFields).toHaveBeenCalledWith({
        app: "222",
        properties: {
          complexField: {
            type: "RADIO_BUTTON",
            code: "complexField",
            label: "Complex Field",
            required: true,
            options: {
              option1: { label: "Option 1", index: "0" },
              option2: { label: "Option 2", index: "1" },
            },
            align: "VERTICAL",
            defaultValue: "option1",
          },
        },
        revision: undefined,
      });

      expect(result.structuredContent).toEqual({
        revision: "7",
      });
    });

    it("should handle API errors appropriately", async () => {
      const mockError = new Error("API Error: Field code already exists");
      mockAddFormFields.mockRejectedValue(mockError);

      const mockClient = createMockClient();
      mockClient.app.addFormFields = mockAddFormFields;

      await expect(
        addFormFields.callback(
          {
            app: "123",
            properties: {
              duplicateField: {
                type: "SINGLE_LINE_TEXT",
                code: "duplicateField",
                label: "Duplicate Field",
              },
            },
          },
          { client: mockClient },
        ),
      ).rejects.toThrow("API Error: Field code already exists");

      expect(mockAddFormFields).toHaveBeenCalledWith({
        app: "123",
        properties: {
          duplicateField: {
            type: "SINGLE_LINE_TEXT",
            code: "duplicateField",
            label: "Duplicate Field",
          },
        },
        revision: undefined,
      });
    });
  });
});
