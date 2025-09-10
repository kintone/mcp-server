import { z } from "zod";
import { createTool } from "../../factory.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const inputSchema = {
  app: z.string().describe("The ID of the app (numeric value as string)"),
  ids: z
    .array(z.string())
    .describe("Array of record IDs to delete (numeric values as strings)")
    .min(1, "At least one record ID is required")
    .max(100, "Maximum 100 records can be deleted at once"),
  revisions: z
    .array(z.string())
    .optional()
    .describe(
      "Array of expected revision numbers for each record (numeric values as strings). If specified, must have the same length as ids array. Deletion will fail if current revisions don't match. Specify -1 or omit to skip revision validation.",
    ),
};

const outputSchema = {};

const toolName = "kintone-delete-records";
const toolConfig = {
  title: "Delete Records",
  description:
    "Delete multiple records from a kintone app. Maximum 100 records can be deleted at once.",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { app, ids, revisions },
  { client },
) => {
  await client.record.deleteRecords({ app, ids, revisions });

  return {
    structuredContent: {},
    content: [],
  };
};

export const deleteRecords = createTool(toolName, toolConfig, callback);
