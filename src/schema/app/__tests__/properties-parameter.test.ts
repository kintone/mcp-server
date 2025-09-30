import { describe, it, expect } from "vitest";
import { z } from "zod";
import { propertiesForParameterSchema } from "../properties-parameter.js";

describe("properties-parameter schema", () => {
  describe("lookupSchema with type NUMBER", () => {
    const schema = z.object({
      properties: propertiesForParameterSchema,
    });

    it("should preserve lookup object with all properties for NUMBER type", () => {
      const input = {
        properties: {
          lookup_field: {
            type: "NUMBER",
            code: "lookup_field",
            label: "Lookup Field",
            lookup: {
              relatedApp: {
                app: "17",
                code: "related_app",
              },
              relatedKeyField: "record_number",
              fieldMappings: [
                {
                  field: "lookup_field",
                  relatedField: "source_field",
                },
              ],
              lookupPickerFields: ["record_number", "source_field"],
              filterCond: 'status = "active"',
              sort: "created_time desc",
            },
          },
        },
      };

      const result = schema.parse(input);

      expect(result.properties.lookup_field).toHaveProperty("lookup");
      expect(result.properties.lookup_field).toMatchObject({
        lookup: {
          relatedApp: {
            app: "17",
            code: "related_app",
          },
          relatedKeyField: "record_number",
          fieldMappings: [
            {
              field: "lookup_field",
              relatedField: "source_field",
            },
          ],
          lookupPickerFields: ["record_number", "source_field"],
          filterCond: 'status = "active"',
          sort: "created_time desc",
        },
      });
    });

    it("should preserve lookup object with empty filterCond and sort", () => {
      const input = {
        properties: {
          lookup_field: {
            type: "NUMBER",
            code: "lookup_field",
            label: "Lookup Field",
            lookup: {
              relatedApp: {
                app: "17",
                code: "related_app",
              },
              relatedKeyField: "record_number",
              fieldMappings: [
                {
                  field: "lookup_field",
                  relatedField: "source_field",
                },
              ],
              lookupPickerFields: ["record_number"],
              filterCond: "",
              sort: "",
            },
          },
        },
      };

      const result = schema.parse(input);

      expect(result.properties.lookup_field).toMatchObject({
        lookup: {
          filterCond: "",
          sort: "",
        },
      });
    });

    it("should preserve lookup object with multiple fieldMappings", () => {
      const input = {
        properties: {
          lookup_field: {
            type: "NUMBER",
            code: "lookup_field",
            label: "Lookup Field",
            lookup: {
              relatedApp: {
                app: "17",
                code: "related_app",
              },
              relatedKeyField: "record_number",
              fieldMappings: [
                {
                  field: "lookup_field",
                  relatedField: "source_field",
                },
                {
                  field: "lookup_date",
                  relatedField: "report_date",
                },
                {
                  field: "lookup_department",
                  relatedField: "department",
                },
              ],
              lookupPickerFields: ["record_number"],
              filterCond: "",
              sort: "",
            },
          },
        },
      };

      const result = schema.parse(input);

      expect(result.properties.lookup_field).toMatchObject({
        lookup: {
          fieldMappings: [
            {
              field: "lookup_field",
              relatedField: "source_field",
            },
            {
              field: "lookup_date",
              relatedField: "report_date",
            },
            {
              field: "lookup_department",
              relatedField: "department",
            },
          ],
        },
      });
    });
  });

  describe("lookupSchema with type SINGLE_LINE_TEXT", () => {
    const schema = z.object({
      properties: propertiesForParameterSchema,
    });

    it("should preserve lookup object for SINGLE_LINE_TEXT type", () => {
      const input = {
        properties: {
          lookup_field: {
            type: "SINGLE_LINE_TEXT",
            code: "lookup_field",
            label: "Lookup Field",
            lookup: {
              relatedApp: {
                app: "17",
                code: "related_app",
              },
              relatedKeyField: "record_number",
              fieldMappings: [
                {
                  field: "lookup_field",
                  relatedField: "source_field",
                },
              ],
              lookupPickerFields: ["record_number"],
              filterCond: "",
              sort: "",
            },
          },
        },
      };

      const result = schema.parse(input);

      expect(result.properties.lookup_field).toHaveProperty("lookup");
      expect(result.properties.lookup_field).toMatchObject({
        type: "SINGLE_LINE_TEXT",
        lookup: {
          relatedApp: {
            app: "17",
            code: "related_app",
          },
        },
      });
    });
  });

  describe("compressed schemas", () => {
    const schema = z.object({
      properties: propertiesForParameterSchema,
    });

    it("should correctly parse MULTI_LINE_TEXT field", () => {
      const input = {
        properties: {
          multi_text: {
            type: "MULTI_LINE_TEXT",
            code: "multi_text",
            label: "Multi Line Text",
            defaultValue: "default text",
          },
        },
      };

      const result = schema.parse(input);

      expect(result.properties.multi_text.type).toBe("MULTI_LINE_TEXT");
      expect(result.properties.multi_text.code).toBe("multi_text");
    });

    it("should correctly parse RICH_TEXT field", () => {
      const input = {
        properties: {
          rich_text: {
            type: "RICH_TEXT",
            code: "rich_text",
            label: "Rich Text",
            defaultValue: "<p>default text</p>",
          },
        },
      };

      const result = schema.parse(input);

      expect(result.properties.rich_text.type).toBe("RICH_TEXT");
    });

    it("should correctly parse DATE field", () => {
      const input = {
        properties: {
          date_field: {
            type: "DATE",
            code: "date_field",
            label: "Date Field",
            defaultNowValue: true,
          },
        },
      };

      const result = schema.parse(input);

      expect(result.properties.date_field).toMatchObject({
        type: "DATE",
        defaultNowValue: true,
      });
    });

    it("should correctly parse DATETIME field", () => {
      const input = {
        properties: {
          datetime_field: {
            type: "DATETIME",
            code: "datetime_field",
            label: "DateTime Field",
            defaultNowValue: false,
          },
        },
      };

      const result = schema.parse(input);

      expect(result.properties.datetime_field.type).toBe("DATETIME");
    });

    it("should correctly parse USER_SELECT field", () => {
      const input = {
        properties: {
          user_field: {
            type: "USER_SELECT",
            code: "user_field",
            label: "User Field",
            entities: [
              {
                type: "USER" as const,
                code: "user1",
              },
            ],
          },
        },
      };

      const result = schema.parse(input);

      expect(result.properties.user_field).toMatchObject({
        type: "USER_SELECT",
        entities: [
          {
            type: "USER",
            code: "user1",
          },
        ],
      });
    });

    it("should correctly parse ORGANIZATION_SELECT field", () => {
      const input = {
        properties: {
          org_field: {
            type: "ORGANIZATION_SELECT",
            code: "org_field",
            label: "Organization Field",
            entities: [
              {
                type: "ORGANIZATION" as const,
                code: "org1",
              },
            ],
          },
        },
      };

      const result = schema.parse(input);

      expect(result.properties.org_field.type).toBe("ORGANIZATION_SELECT");
    });

    it("should correctly parse GROUP_SELECT field", () => {
      const input = {
        properties: {
          group_field: {
            type: "GROUP_SELECT",
            code: "group_field",
            label: "Group Field",
            entities: [
              {
                type: "GROUP" as const,
                code: "group1",
              },
            ],
          },
        },
      };

      const result = schema.parse(input);

      expect(result.properties.group_field.type).toBe("GROUP_SELECT");
    });
  });

  describe("union ordering - regression tests", () => {
    const schema = z.object({
      properties: propertiesForParameterSchema,
    });

    it("should not strip lookup property when type is NUMBER (regression test)", () => {
      // This test ensures the bug where numberSchema matched before lookupSchema doesn't recur
      const input = {
        properties: {
          lookup_field: {
            type: "NUMBER",
            code: "lookup_field",
            label: "Lookup Field",
            lookup: {
              relatedApp: {
                app: "17",
                code: "related_app",
              },
              relatedKeyField: "record_number",
              fieldMappings: [
                {
                  field: "lookup_field",
                  relatedField: "source_field",
                },
              ],
              lookupPickerFields: ["record_number"],
              filterCond: "",
              sort: "",
            },
          },
        },
      };

      const result = schema.parse(input);

      // If union ordering is wrong, lookup property will be stripped
      expect(result.properties.lookup_field).toHaveProperty("lookup");
      expect(result.properties.lookup_field).toMatchObject({
        type: "NUMBER",
        lookup: {
          relatedApp: {
            app: "17",
          },
        },
      });
    });

    it("should not strip lookup property when type is SINGLE_LINE_TEXT (regression test)", () => {
      const input = {
        properties: {
          lookup_field: {
            type: "SINGLE_LINE_TEXT",
            code: "lookup_field",
            label: "Lookup Field",
            lookup: {
              relatedApp: {
                app: "17",
                code: "related_app",
              },
              relatedKeyField: "record_number",
              fieldMappings: [
                {
                  field: "lookup_field",
                  relatedField: "source_field",
                },
              ],
              lookupPickerFields: ["record_number"],
              filterCond: "",
              sort: "",
            },
          },
        },
      };

      const result = schema.parse(input);

      expect(result.properties.lookup_field).toHaveProperty("lookup");
      expect(result.properties.lookup_field).toMatchObject({
        type: "SINGLE_LINE_TEXT",
        lookup: {
          relatedApp: {
            app: "17",
          },
        },
      });
    });

    it("should allow NUMBER field without lookup property", () => {
      const input = {
        properties: {
          number_field: {
            type: "NUMBER",
            code: "number_field",
            label: "Number Field",
            minValue: "0",
            maxValue: "100",
          },
        },
      };

      const result = schema.parse(input);

      expect(result.properties.number_field.type).toBe("NUMBER");
      expect(result.properties.number_field).not.toHaveProperty("lookup");
    });

    it("should allow SINGLE_LINE_TEXT field without lookup property", () => {
      const input = {
        properties: {
          text_field: {
            type: "SINGLE_LINE_TEXT",
            code: "text_field",
            label: "Text Field",
            maxLength: "255",
          },
        },
      };

      const result = schema.parse(input);

      expect(result.properties.text_field.type).toBe("SINGLE_LINE_TEXT");
      expect(result.properties.text_field).not.toHaveProperty("lookup");
    });
  });

  describe("inSubtableFieldSchema union ordering", () => {
    it("should preserve lookup property in subtable field with type NUMBER", () => {
      const schema = z.object({
        properties: propertiesForParameterSchema,
      });

      const input = {
        properties: {
          subtable: {
            type: "SUBTABLE",
            code: "subtable",
            label: "Subtable",
            fields: {
              lookup_field: {
                type: "NUMBER",
                code: "lookup_field",
                label: "Lookup Field",
                lookup: {
                  relatedApp: {
                    app: "17",
                    code: "related_app",
                  },
                  relatedKeyField: "record_number",
                  fieldMappings: [
                    {
                      field: "lookup_field",
                      relatedField: "source_field",
                    },
                  ],
                  lookupPickerFields: ["record_number"],
                  filterCond: "",
                  sort: "",
                },
              },
            },
          },
        },
      };

      const result = schema.parse(input);

      expect(result.properties.subtable).toMatchObject({
        type: "SUBTABLE",
        fields: {
          lookup_field: {
            type: "NUMBER",
            lookup: {
              relatedApp: {
                app: "17",
              },
            },
          },
        },
      });
    });
  });
});
