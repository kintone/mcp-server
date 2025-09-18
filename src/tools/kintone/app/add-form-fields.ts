import { z } from "zod";
import { createTool } from "../../factory.js";
import type { KintoneToolCallback } from "../../types/tool.js";
import { baseFieldProperties } from "../../../schema/app/index.js";

// 新規作成用フィールドプロパティスキーマ（ベースプロパティを使用）
const addFieldPropertySchema = z.object(baseFieldProperties);

const inputSchema = {
  app: z
    .string()
    .describe("The ID of the app to add fields to (numeric value as string)"),
  properties: z
    .record(addFieldPropertySchema)
    .describe("Object containing field configurations to add"),
  revision: z.string().optional().describe("App configuration revision number"),
};

const outputSchema = {
  revision: z.string().describe("Updated app configuration revision number"),
};

const toolName = "kintone-add-field";
const toolConfig = {
  title: "Add Field",
  description: "Add new fields to a kintone app",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { app, properties, revision },
  { client },
) => {
  const response = await client.app.addFormFields({
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

export const addFormFields = createTool(toolName, toolConfig, callback);
