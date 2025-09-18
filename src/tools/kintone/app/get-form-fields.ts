import { z } from "zod";
import { createTool } from "../../factory.js";
import type { KintoneToolCallback } from "../../types/tool.js";
import { baseFieldProperties } from "../../../schema/app/index.js";

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

// レスポンス用フィールドプロパティスキーマ（ベース + enabled）
const responseFieldPropertySchema = z.object({
  ...baseFieldProperties,
  enabled: z
    .boolean()
    .optional()
    .describe("Whether the field is enabled (for STATUS and CATEGORY fields)"),
});

const outputSchema = {
  properties: z
    .record(responseFieldPropertySchema)
    .describe("Object containing field configurations"),
  revision: z.string().describe("App configuration revision number"),
};

const toolName = "kintone-get-form-fields";
const toolConfig = {
  title: "Get Form Fields",
  description: "Get form field settings from a kintone app",
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
