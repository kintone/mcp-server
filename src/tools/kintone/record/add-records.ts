import { z } from "zod";
import { createTool } from "../../utils.js";
import { getKintoneClient } from "../../../client.js";
import { parseKintoneClientConfig } from "../../../config.js";
import { recordSchemaForParameterWithoutFile } from "../../../schema/record/record-for-parameter.js";

const inputSchema = {
  app: z
    .union([z.number(), z.string()])
    .describe("The ID of the app to add records to"),
  records: z
    .array(recordSchemaForParameterWithoutFile)
    .min(1)
    .max(100)
    .describe(
      "Array of records to add (min 1, max 100). Each record is an object with field codes as keys. Use kintone-get-form-fields tool first to discover available field codes and their types.",
    ),
};

const outputSchema = {
  ids: z.array(z.string()).describe("Array of IDs of the created records"),
  revisions: z
    .array(z.string())
    .describe("Array of revision numbers of the created records"),
};

export const addRecords = createTool(
  "kintone-add-records",
  {
    description:
      "Add multiple records to a kintone app. Use kintone-get-form-fields tool first to discover available field codes and their required formats. Note: Some fields cannot be registered (LOOKUP copies, STATUS, CATEGORY, CALC, ASSIGNEE, auto-calculated fields).",
    inputSchema,
    outputSchema,
  },
  async ({ app, records }) => {
    const config = parseKintoneClientConfig();
    const client = getKintoneClient(config);

    const response = await client.record.addRecords({
      app,
      records,
    });

    const result = {
      ids: response.ids,
      revisions: response.revisions,
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
