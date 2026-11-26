import { z } from "zod";
import { createTool } from "../../factory.js";
import {
  fieldEntriesSchema,
  toRecordForParameter,
} from "../../../schema/record/index.js";
import { withoutAdvertisedRequired } from "../../../schema/without-advertised-required.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const inputSchema = {
  app: z
    .string()
    .describe("The ID of the app to add records to (numeric value as string)"),
  records: z
    .array(withoutAdvertisedRequired(z.object({ fields: fieldEntriesSchema })))
    .min(1)
    .max(100)
    .describe(
      'Array of records to add (min 1, max 100). Each record lists its field values in fields as { fieldCode, value } entries, e.g. { fields: [ { fieldCode: "title", value: "Hello" }, { fieldCode: "tags", value: ["a", "b"] } ] }. For SUBTABLE fields, value is an array of rows { id: "", fields: [ { fieldCode, value } ] }. Use kintone-get-form-fields tool first to discover available field codes and their types.',
    ),
};

const outputSchema = {
  ids: z.array(z.string()).describe("Array of IDs of the created records"),
  revisions: z
    .array(z.string())
    .describe("Array of revision numbers of the created records"),
};

const toolName = "kintone-add-records";
const toolConfig = {
  title: "Add Records",
  description:
    "Add multiple records to a kintone app. Give each record as { fields: [ { fieldCode, value } ] } and leave out fields you do not set. Use kintone-get-form-fields tool first to discover available field codes and their required formats. Note: Some fields cannot be registered (LOOKUP copies, STATUS, CATEGORY, CALC, ASSIGNEE, auto-calculated fields, FILE).",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { app, records },
  { client },
) => {
  const response = await client.record.addRecords({
    app,
    records: records.map(({ fields }) => toRecordForParameter(fields)),
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
};

export const addRecords = createTool(toolName, toolConfig, callback);
