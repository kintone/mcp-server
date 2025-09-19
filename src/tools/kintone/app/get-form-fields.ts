import { z } from "zod";
import { createTool } from "../../factory.js";
import type { KintoneToolCallback } from "../../types/tool.js";
import { propertiesForParameterSchema } from "../../../schema/app/index.js";

const inputSchema = {
  app: z
    .string()
    .describe(
      "The ID of the app to retrieve form fields from (numeric value as string)",
    ),
  lang: z
    .enum(["ja", "en", "zh", "default", "user"])
    .optional()
    .describe("The language for field names"),
  preview: z
    .boolean()
    .optional()
    .describe("Whether to get form fields from pre-live environment"),
};

const outputSchema = {
  properties: propertiesForParameterSchema.describe(
    "Object containing field configurations",
  ),
  revision: z.string().describe("App configuration revision number"),
};

const toolName = "kintone-get-form-fields";
const toolConfig = {
  title: "Get Form Fields",
  description:
    "Get form field settings from a kintone app. Returns detailed field information including type, code, label, and all configuration settings (required status, default values, validation rules, options for selection fields). Response includes 'properties' object with all fields and 'revision' string. Use this before add/update operations to understand current field structure. Supports both live and pre-live app settings retrieval.",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { app, lang, preview },
  { client },
) => {
  const response = await client.app.getFormFields({
    app,
    lang,
    preview,
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
};

export const getFormFields = createTool(toolName, toolConfig, callback);
