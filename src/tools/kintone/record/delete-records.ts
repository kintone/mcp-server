import { z } from "zod";
import { createTool } from "../../utils.js";
import { getKintoneClient } from "../../../client.js";
import { parseKintoneClientConfig } from "../../../config.js";

const inputSchema = {
  app: z.number().describe("The ID of the app"),
  ids: z
    .array(z.number())
    .describe("Array of record IDs to delete")
    .min(1, "At least one record ID is required")
    .max(100, "Maximum 100 records can be deleted at once"),
  revisions: z
    .array(z.string())
    .optional()
    .describe(
      "Array of expected revision numbers for each record. If specified, must have the same length as ids array. Deletion will fail if current revisions don't match. Specify -1 or omit to skip revision validation.",
    ),
};

const outputSchema = {};

export const deleteRecords = createTool(
  "kintone-delete-records",
  {
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
