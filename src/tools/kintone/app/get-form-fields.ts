import { z } from "zod";
import { createTool } from "../../utils.js";
import { getKintoneClient } from "../../../client.js";
import { parseKintoneClientConfig } from "../../../config.js";

const inputSchema = {
  app: z
    .union([z.number(), z.string()])
    .describe("The ID of the app to retrieve form fields from"),
  lang: z
    .enum(["ja", "en", "zh", "default", "user"])
    .optional()
    .describe("The language for field names"),
};

const fieldPropertySchema = z.object({
  type: z.string().describe("The field type"),
  code: z.string().describe("The field code"),
  label: z.string().describe("The field name"),
  enabled: z
    .boolean()
    .optional()
    .describe("Whether the field is enabled (for STATUS and CATEGORY fields)"),
  noLabel: z.boolean().optional().describe("Whether to hide the field name"),
  required: z.boolean().optional().describe("Whether the field is required"),
  unique: z.boolean().optional().describe("Whether the field must be unique"),
  maxValue: z.string().optional().describe("Maximum value"),
  minValue: z.string().optional().describe("Minimum value"),
  maxLength: z.string().optional().describe("Maximum length"),
  minLength: z.string().optional().describe("Minimum length"),
  defaultValue: z.any().optional().describe("Default value"),
  defaultNowValue: z
    .boolean()
    .optional()
    .describe("Whether to use current date/time as default"),
  entities: z
    .array(
      z.object({
        type: z.enum(["USER", "GROUP", "ORGANIZATION"]),
        code: z.string(),
      }),
    )
    .optional()
    .describe("Default entities for user/group/organization selection fields"),
  options: z
    .record(
      z.object({
        label: z.string(),
        index: z.string(),
      }),
    )
    .optional()
    .describe("Options for selection fields"),
  align: z
    .enum(["HORIZONTAL", "VERTICAL"])
    .optional()
    .describe("Option alignment for radio/checkbox fields"),
  expression: z.string().optional().describe("Calculation formula"),
  hideExpression: z
    .boolean()
    .optional()
    .describe("Whether to hide the formula"),
  format: z.string().optional().describe("Display format"),
  displayScale: z.string().optional().describe("Number of decimal places"),
  unit: z.string().optional().describe("Unit symbol"),
  unitPosition: z
    .enum(["BEFORE", "AFTER"])
    .optional()
    .describe("Unit position"),
  digit: z.boolean().optional().describe("Whether to use thousands separator"),
  thumbnailSize: z.string().optional().describe("Image thumbnail size"),
  protocol: z
    .enum(["WEB", "CALL", "MAIL"])
    .optional()
    .describe("Link protocol"),
  lookup: z
    .object({
      relatedApp: z.object({
        app: z.string(),
        code: z.string(),
      }),
      relatedKeyField: z.string(),
      fieldMappings: z.array(
        z.object({
          field: z.string(),
          relatedField: z.string(),
        }),
      ),
      lookupPickerFields: z.array(z.string()),
      filterCond: z.string().optional(),
      sort: z.string().optional(),
    })
    .optional()
    .describe("Lookup settings"),
  referenceTable: z
    .object({
      relatedApp: z.object({
        app: z.string(),
        code: z.string(),
      }),
      condition: z.object({
        field: z.string(),
        relatedField: z.string(),
      }),
      filterCond: z.string().optional(),
      displayFields: z.array(z.string()),
      sort: z.string().optional(),
      size: z.string().optional(),
    })
    .optional()
    .describe("Related records settings"),
  fields: z.record(z.any()).optional().describe("Fields in subtable"),
  openGroup: z
    .boolean()
    .optional()
    .describe("Whether the group is expanded by default"),
});

const outputSchema = {
  properties: z
    .record(fieldPropertySchema)
    .describe("Object containing field configurations"),
  revision: z.string().describe("App configuration revision number"),
};

export const getFormFields = createTool(
  "kintone-get-form-fields",
  {
    description: "Get form field settings from a kintone app",
    inputSchema,
    outputSchema,
  },
  async ({ app, lang }) => {
    const config = parseKintoneClientConfig();
    const client = getKintoneClient(config);

    const response = await client.app.getFormFields({
      app,
      lang,
    });

    const result = {
      properties: response.properties,
      revision: response.revision,
    };

    return {
      structuredContent: result,
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);
