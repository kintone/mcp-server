import { z } from "zod";
import { createTool } from "../../factory.js";
import {
  fieldEntriesSchema,
  toRecordForParameter,
} from "../../../schema/record/index.js";
import { withoutAdvertisedRequired } from "../../../schema/without-advertised-required.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const revisionSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined
        ? 'revision is required. Specify "-1" to skip revision validation'
        : undefined,
  })
  // Not .regex(): its pattern would be advertised in tools/list.
  .refine((revision) => /^(-1|\d+)$/.test(revision), {
    message:
      'revision must be "-1" or a revision number such as "3". Specify "-1" to skip revision validation',
  })
  .describe(
    'Required. Expected revision number (numeric value as string). The update fails if the current revision doesn\'t match. Specify "-1" to skip revision validation.',
  );

const updateRecordSchema = z.object({
  // updateKey指定は対象外
  id: z
    .string()
    .describe("Required. Record ID to update (numeric value as string)"),
  revision: revisionSchema,
  fields: fieldEntriesSchema
    // Not .min(1): its minItems would be advertised in tools/list.
    .refine((fields) => fields.length > 0, {
      message: "fields must contain at least one field to update",
    })
    .describe(
      "Required. Field values to update. Include only the fields to change. Use kintone-get-form-fields tool first to discover available field codes and their types.",
    ),
});

const inputSchema = {
  app: z
    .string()
    .describe(
      "The ID of the app to update records in (numeric value as string)",
    ),
  records: z
    .array(withoutAdvertisedRequired(updateRecordSchema))
    .min(1)
    .max(100)
    .describe(
      "Array of records to update (min 1, max 100). Each record must have id (which record to update), revision, and fields (the field values to set).",
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
    'Update multiple records in a kintone app. Use kintone-get-form-fields tool first to discover available field codes and their required formats. To update a SUBTABLE field, pass every row to keep: existing rows with their row ID from kintone-get-records, and new rows with "" as the ID. Rows left out are deleted. Note: Some fields cannot be updated (LOOKUP copies, STATUS, CATEGORY, CALC, ASSIGNEE, FILE, auto-calculated fields).',
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { app, records },
  { client },
) => {
  const response = await client.record.updateRecords({
    app,
    records: records.map(({ id, revision, fields }) => ({
      id,
      revision,
      record: toRecordForParameter(fields),
    })),
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
