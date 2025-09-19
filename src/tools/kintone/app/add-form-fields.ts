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

const toolName = "kintone-add-field";
const toolConfig = {
  title: "Add Field",
  description:
    "Add new fields to a kintone app (preview environment only). Requires App Management permissions. Cannot add Status, Assignee, or Category fields. Field codes must be unique, max 128 chars, cannot start with numbers, and only '_' symbol allowed. For selection fields (DROP_DOWN/RADIO_BUTTON/CHECK_BOX/MULTI_SELECT), option keys must exactly match their label values. Options require 'label' and 'index' properties. Use kintone-get-form-fields first to check existing fields. Changes require kintone-deploy-app to apply to live app.",
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
