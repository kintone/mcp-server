import { z } from "zod";
import { createTool } from "../../factory.js";
import type { KintoneToolCallback } from "../../types/tool.js";
import { baseFieldProperties } from "../../../schema/app/index.js";

// 更新用フィールドプロパティスキーマ（ベースプロパティを使用）
const updateFieldPropertySchema = z.object(baseFieldProperties);

const inputSchema = {
  app: z
    .string()
    .describe(
      "The ID of the app to update form fields for (numeric value as string)",
    ),
  properties: z
    .record(updateFieldPropertySchema)
    .describe("Object containing field configurations to update"),
  revision: z
    .string()
    .optional()
    .describe("The expected app configuration revision number before updating"),
};

const outputSchema = {
  revision: z.string().describe("Updated app configuration revision number"),
};

const toolName = "kintone-update-form-fields";
const toolConfig = {
  title: "Update Form Fields",
  description: "Update form field settings in a kintone app (test environment)",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { app, properties, revision },
  { client },
) => {
  const response = await client.app.updateFormFields({
    app,
    properties: properties as any,
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

export const updateFormFields = createTool(toolName, toolConfig, callback);
