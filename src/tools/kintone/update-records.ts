import { z } from "zod";
import { createTool } from "../types.js";
import { getKintoneClient } from "../../client.js";
import { parseKintoneClientConfig } from "../../config.js";
import { recordInputSchema } from "./schemas.js";

const updateRecordSchema = z.object({
  // updateKey指定は対象外
  id: z.string().describe("Record ID to update"),
  record: recordInputSchema.describe(
    "Record data with field codes as keys. Use kintone-get-form-fields tool first to discover available field codes and their types.",
  ),
});

const inputSchema = {
  app: z
    .union([z.number(), z.string()])
    .describe("The ID of the app to update records in"),
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

export const updateRecords = createTool(
  "kintone-update-records",
  {
    description:
      "Update multiple records in a kintone app. Use kintone-get-form-fields tool first to discover available field codes and their required formats. Note: Some fields cannot be updated (LOOKUP copies, STATUS, CATEGORY, CALC, ASSIGNEE, auto-calculated fields).",
    inputSchema,
    outputSchema,
  },
  async ({ app, records }) => {
    const config = parseKintoneClientConfig();
    const client = getKintoneClient(config);

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
  },
);
