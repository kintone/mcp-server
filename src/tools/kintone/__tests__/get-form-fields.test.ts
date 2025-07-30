import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getFormFields } from "../get-form-fields.js";
import { z } from "zod";
import { mockExtra, mockKintoneConfig } from "../../../__tests__/utils.js";

// Mock the KintoneRestAPIClient
const mockGetFormFields = vi.fn();
vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: vi.fn().mockImplementation(() => ({
    app: {
      getFormFields: mockGetFormFields,
    },
  })),
}));

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
        "Get form field settings from a kintone app",
      );
    });

    it("should have valid input schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getFormFields.config.inputSchema!);

      // Valid input - required app field only (number)
      const validInput = {
        app: 123,
      };
      expect(() => schema.parse(validInput)).not.toThrow();

      // Valid input - app as string
      const validInputStringApp = {
        app: "123",
      };
      expect(() => schema.parse(validInputStringApp)).not.toThrow();

      // Valid input - with optional lang field
      const validInputWithLang = {
        app: 456,
        lang: "en",
      };
      expect(() => schema.parse(validInputWithLang)).not.toThrow();

      // Valid input - all valid lang values
      const validLangValues = ["ja", "en", "zh", "default", "user"];
      validLangValues.forEach((lang) => {
        expect(() => schema.parse({ app: 123, lang })).not.toThrow();
      });

      // Invalid input - missing required app field
      expect(() => schema.parse({})).toThrow();

      // Invalid input - wrong type for app
      expect(() =>
        schema.parse({
          app: true, // should be number or string
        }),
      ).toThrow();

      // Invalid input - wrong type for lang
      expect(() =>
        schema.parse({
          app: 123,
          lang: 123, // should be string
        }),
      ).toThrow();

      // Invalid input - invalid lang value
      expect(() =>
        schema.parse({
          app: 123,
          lang: "fr", // not in enum
        }),
      ).toThrow();
    });

    it("should have valid output schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getFormFields.config.outputSchema!);

      // Valid output - various field types
      const validOutput = {
        properties: {
          "field_1": {
            type: "SINGLE_LINE_TEXT",
            code: "field_1",
            label: "Text Field",
            noLabel: false,
            required: true,
            unique: false,
            maxLength: "100",
            minLength: "0",
            defaultValue: "",
          },
          "category_field": {
            type: "CATEGORY",
            code: "category_field",
            label: "Category",
            enabled: false,
          },
          "status_field": {
            type: "STATUS",
            code: "status_field",
            label: "Status",
            enabled: true,
          },
          "field_2": {
            type: "NUMBER",
            code: "field_2",
            label: "Number Field",
            noLabel: false,
            required: false,
            unique: false,
            maxValue: "999999",
            minValue: "0",
            defaultValue: "0",
            displayScale: "2",
            unit: "$",
            unitPosition: "BEFORE",
            digit: true,
          },
          "field_3": {
            type: "DROP_DOWN",
            code: "field_3",
            label: "Dropdown Field",
            noLabel: false,
            required: true,
            options: {
              "option1": {
                label: "Option 1",
                index: "0",
              },
              "option2": {
                label: "Option 2",
                index: "1",
              },
            },
            defaultValue: "option1",
          },
          "field_4": {
            type: "CALC",
            code: "field_4",
            label: "Calculation Field",
            noLabel: false,
            expression: "field_2 * 2",
            hideExpression: false,
            format: "NUMBER",
            displayScale: "0",
            unit: "",
            unitPosition: "AFTER",
          },
          "subtable": {
            type: "SUBTABLE",
            code: "subtable",
            label: "Subtable",
            noLabel: false,
            fields: {
              "sub_field_1": {
                type: "SINGLE_LINE_TEXT",
                code: "sub_field_1",
                label: "Subtable Text",
                noLabel: false,
                required: false,
              },
            },
          },
          "radio_field": {
            type: "RADIO_BUTTON",
            code: "radio_field",
            label: "Radio Field",
            options: {
              "opt1": { label: "Option 1", index: "0" },
              "opt2": { label: "Option 2", index: "1" },
            },
            align: "HORIZONTAL",
          },
          "user_select": {
            type: "USER_SELECT",
            code: "user_select",
            label: "User Selection",
            entities: [
              { type: "USER", code: "user1" },
              { type: "GROUP", code: "group1" },
            ],
          },
        },
        revision: "1",
      };
      expect(() => schema.parse(validOutput)).not.toThrow();

      // Valid output - empty properties with revision
      const emptyOutput = {
        properties: {},
        revision: "1",
      };
      expect(() => schema.parse(emptyOutput)).not.toThrow();

      // Invalid output - missing properties field
      expect(() => schema.parse({})).toThrow();

      // Invalid output - missing revision field
      expect(() => schema.parse({ properties: {} })).toThrow();

      // Invalid output - invalid field structure
      expect(() =>
        schema.parse({
          properties: {
            "field_1": {
              type: "SINGLE_LINE_TEXT",
              // missing required fields like code and label
            },
          },
          revision: "1",
        }),
      ).toThrow();
    });
  });

  describe("callback function", () => {
    it("should retrieve form fields successfully", async () => {
      const mockFieldsData = {
        properties: {
          "text_field": {
            type: "SINGLE_LINE_TEXT",
            code: "text_field",
            label: "Text Field",
            noLabel: false,
            required: true,
            unique: false,
            maxLength: "64",
            minLength: "0",
            defaultValue: "Default Text",
          },
          "number_field": {
            type: "NUMBER",
            code: "number_field",
            label: "Number Field",
            noLabel: false,
            required: false,
            unique: false,
            maxValue: "10000",
            minValue: "0",
            defaultValue: "100",
            displayScale: "0",
            unit: "items",
            unitPosition: "AFTER",
            digit: true,
          },
          "dropdown_field": {
            type: "DROP_DOWN",
            code: "dropdown_field",
            label: "Status",
            noLabel: false,
            required: true,
            options: {
              "pending": {
                label: "Pending",
                index: "0",
              },
              "approved": {
                label: "Approved",
                index: "1",
              },
              "rejected": {
                label: "Rejected",
                index: "2",
              },
            },
            defaultValue: "pending",
          },
          "status_assignee": {
            type: "STATUS_ASSIGNEE",
            code: "status_assignee",
            label: "Assignee",
            enabled: false,
          },
        },
        revision: "1",
      };

      mockGetFormFields.mockResolvedValueOnce(mockFieldsData);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getFormFields.config.inputSchema!);
      const params = schema.parse({ app: 123 });

      const result = await getFormFields.callback(params, mockExtra);

      expect(mockGetFormFields).toHaveBeenCalledWith({ app: 123 });
      expect(result.structuredContent).toEqual(mockFieldsData);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockFieldsData, null, 2),
      });
    });

    it("should retrieve form fields with language specified", async () => {
      const mockFieldsData = {
        properties: {
          "field_1": {
            type: "SINGLE_LINE_TEXT",
            code: "field_1",
            label: "Name (English)",
            noLabel: false,
            required: true,
            unique: false,
            maxLength: "100",
            minLength: "0",
            defaultValue: "",
          },
        },
        revision: "2",
      };

      mockGetFormFields.mockResolvedValueOnce(mockFieldsData);

      const result = await getFormFields.callback(
        {
          app: 456,
          lang: "en",
        },
        mockExtra,
      );

      expect(mockGetFormFields).toHaveBeenCalledWith({
        app: 456,
        lang: "en",
      });
      expect(result.structuredContent).toEqual(mockFieldsData);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockFieldsData, null, 2),
      });
    });

    it("should retrieve form fields with app as string", async () => {
      const mockFieldsData = {
        properties: {
          "lookup_field": {
            type: "LOOKUP",
            code: "lookup_field",
            label: "Lookup Field",
            lookup: {
              relatedApp: {
                app: "10",
                code: "MASTER_APP",
              },
              relatedKeyField: "key_field",
              fieldMappings: [
                { field: "name", relatedField: "master_name" },
                { field: "value", relatedField: "master_value" },
              ],
              lookupPickerFields: ["key_field", "master_name"],
              filterCond: "status = \"active\"",
              sort: "key_field asc",
            },
          },
          "reference_table": {
            type: "REFERENCE_TABLE",
            code: "reference_table",
            label: "Related Records",
            referenceTable: {
              relatedApp: {
                app: "20",
                code: "RELATED_APP",
              },
              condition: {
                field: "parent_id",
                relatedField: "レコード番号",
              },
              displayFields: ["title", "status", "created_time"],
              sort: "created_time desc",
              size: "5",
            },
          },
        },
        revision: "3",
      };

      mockGetFormFields.mockResolvedValueOnce(mockFieldsData);

      const result = await getFormFields.callback(
        {
          app: "789",
          lang: "ja",
        },
        mockExtra,
      );

      expect(mockGetFormFields).toHaveBeenCalledWith({
        app: "789",
        lang: "ja",
      });
      expect(result.structuredContent).toEqual(mockFieldsData);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockFieldsData, null, 2),
      });
    });
  });
});