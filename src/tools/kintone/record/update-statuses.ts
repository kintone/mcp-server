import { z } from "zod";
import type { KintoneToolCallback } from "../../schema.js";
import { createTool } from "../../factory.js";

const statusRecordSchema = z.object({
  id: z.string().describe("Record ID (numeric value as string)"),
  action: z
    .string()
    .describe(
      "Action name to execute. Must be specified in the user's display language if multiple languages are configured. If multiple actions with the same name exist for the current status, an error will occur.",
    ),
  assignee: z
    .string()
    .optional()
    .describe(
      "User login name to assign as the assignee. Required when: 1) The destination status has 'Select assignee from these users' enabled and selectable users exist, 2) Setting an assignee for the initial status when returning to it.",
    ),
  revision: z
    .string()
    .optional()
    .describe(
      "Expected revision number (numeric value as string). If it doesn't match the actual revision, an error occurs and status is not updated. Specify -1 or omit to skip revision validation.",
    ),
});

const inputSchema = {
  app: z.string().describe("The ID of the app (numeric value as string)"),
  records: z
    .array(statusRecordSchema)
    .min(1)
    .max(100)
    .describe(
      "Array of records to update status (min 1, max 100). Each record contains id, action, and optionally assignee and revision.",
    ),
};

const outputSchema = {
  records: z
    .array(
      z.object({
        id: z.string().describe("Record ID"),
        revision: z
          .string()
          .describe(
            "New revision number after status change. The revision increases by 2 (one for action execution, one for status update).",
          ),
      }),
    )
    .describe("Array of updated record information"),
};

const toolName = "kintone-update-statuses";
const toolConfig = {
  title: "Update Statuses",
  description:
    "Update status of multiple records in a kintone app. Requires process management feature to be enabled. Maximum 100 records can be updated at once.",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { app, records },
  { client },
) => {
  const response = await client.record.updateRecordsStatus({
    app,
    records,
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

export const updateStatuses = createTool(toolName, toolConfig, callback);
