import { z } from "zod";
import type { KintoneToolCallback } from "../../schema.js";
import { createTool } from "../../factory.js";
import { recordSchemaForParameter } from "../../../schema/record/index.js";

const updateRecordSchema = z.object({
  // updateKey指定は対象外
  id: z.string().describe("Record ID to update (numeric value as string)"),
  record: recordSchemaForParameter.describe(
    "Record data with field codes as keys. Use kintone-get-form-fields tool first to discover available field codes and their types.",
  ),
  revision: z
    .string()
    .optional()
    .describe(
      "Expected revision number (numeric value as string). If specified, the update will fail if the current revision doesn't match. Specify -1 or omit to skip revision validation.",
    ),
});

const inputSchema = {
  app: z
    .string()
    .describe(
      "The ID of the app to update records in (numeric value as string)",
    ),
  records: z
    .array(updateRecordSchema)
    .min(1)
    .max(100)
    .describe(
      "Array of records to update (min 1, max 100). Each record must have an ID to identify which record to update.",
    ),
};

const outputSchema = {
  records: z
    .array(
      z.object({
        id: z.string().describe("Record ID"),
        revision: z.string().describe("New revision number after update"),
      }),
    )
    .describe("Array of updated record information"),
};

const toolName = "kintone-update-records";
const toolConfig = {
  title: "Update Records",
  description:
    "Update multiple records in a kintone app. Use kintone-get-form-fields tool first to discover available field codes and their required formats. Note: Some fields cannot be updated (LOOKUP copies, STATUS, CATEGORY, CALC, ASSIGNEE, auto-calculated fields).",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { app, records },
  { client },
) => {
  const response = await client.record.updateRecords({
    app,
    records,
    upsert: false, // upsertモードは対象外
  });

  const result = {
    records: response.records,
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

export const updateRecords = createTool(toolName, toolConfig, callback);
