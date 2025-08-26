import { z } from "zod";
import { createTool } from "../../utils.js";
import { getKintoneClient } from "../../../client.js";
import { parseKintoneClientConfig } from "../../../config/index.js";

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

export const deleteRecords = createTool(
  "kintone-delete-records",
  {
    title: "Delete Records",
    description:
      "Delete multiple records from a kintone app. Maximum 100 records can be deleted at once.",
    inputSchema,
    outputSchema,
  },
  async ({ app, ids, revisions }) => {
    const config = parseKintoneClientConfig();
    const client = getKintoneClient(config);

    await client.record.deleteRecords({ app, ids, revisions });

    return {
      structuredContent: {},
      content: [],
    };
  },
);
