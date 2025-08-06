import { z } from "zod";
import { createTool } from "../types.js";
import { getKintoneClient } from "../../client.js";
import { parseKintoneClientConfig } from "../../config.js";

const inputSchema = {
  app: z.number().describe("The ID of the app"),
  ids: z
    .array(z.number())
    .describe("Array of record IDs to delete")
    .min(1, "At least one record ID is required")
    .max(100, "Maximum 100 records can be deleted at once"),
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
  async ({ app, ids }) => {
    const config = parseKintoneClientConfig();
    const client = getKintoneClient(config);

    await client.record.deleteRecords({ app, ids });

    return {
      structuredContent: {},
      content: [],
    };
  },
);
