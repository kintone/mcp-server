import { z } from "zod";
import { createTool } from "../../factory.js";
import type { KintoneToolCallback } from "../../types/tool.js";
import { layoutForParameterSchema } from "../../../schema/app/index.js";

const inputSchema = {
  app: z
    .string()
    .describe(
      "The ID of the app to update form layout for (numeric value as string)",
    ),
  layout: layoutForParameterSchema.describe(
    "Array of layout elements (rows, subtables, groups)",
  ),
  revision: z
    .string()
    .optional()
    .describe(
      "Expected app configuration revision number. If the specified revision number does not match the current app's revision, an error will occur and the update will not be performed. If not specified or set to '-1', the revision number will not be checked.",
    ),
};

const outputSchema = {
  revision: z.string().describe("Updated app configuration revision number"),
};

const toolName = "kintone-update-form-layout";
const toolConfig = {
  title: "Update Form Layout",
  description:
    "Update form layout settings in a kintone app (preview environment only). IMPORTANT: Use kintone-get-form-fields tool first to get exact field codes and structure. Field codes are case-sensitive and must match exactly. For SUBTABLE fields, use the correct nested structure: {type: 'SUBTABLE', code: 'table_code', fields: [{type: 'field_type', code: 'field_code'}, ...]}",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { app, layout, revision },
  { client },
) => {
  const response = await client.app.updateFormLayout({
    app,
    layout,
    revision,
  });

  const result = {
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
};

export const updateFormLayout = createTool(toolName, toolConfig, callback);
