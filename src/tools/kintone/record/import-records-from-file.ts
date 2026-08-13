import { z } from "zod";
import { createTool } from "../../factory.js";
import { recordSchemaFromFile } from "../../../schema/record/index.js";
import {
  MAX_RECORDS_PER_REQUEST,
  buildIssueMessage,
  buildWritableFields,
  describeCause,
  describeParseFailure,
  normalizeRecord,
  readRawRecordsFromFile,
  selectTargetRecords,
} from "../../../lib/record-file.js";
import type { RecordFromFile } from "../../../schema/record/index.js";
import type { RecordForWrite } from "../../../lib/record-file.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const inputSchema = {
  app: z.string().describe('App ID (numeric string). e.g. "123"'),
  filePath: z
    .string()
    .describe(
      "Path to the JSON file holding the records to add. Absolute path, or a file name resolved against KINTONE_ATTACHMENTS_DIR.",
    ),
  offset: z
    .number()
    .min(0)
    .optional()
    .describe(
      "Records to skip from the beginning of the file. Use it to resume after a partially failed run.",
    ),
  limit: z
    .number()
    .min(1)
    .optional()
    .describe(
      "Maximum number of records to add. Omit to add every record after offset.",
    ),
  dryRun: z
    .boolean()
    .optional()
    .describe(
      "When true, validate the file against the app form settings without adding any record. Defaults to false.",
    ),
};

const outputSchema = {
  app: z.string().describe("The app ID that records were added to"),
  filePath: z.string().describe("Absolute path to the JSON file that was read"),
  totalRecordsInFile: z
    .number()
    .describe("Number of records contained in the file"),
  targetRecordCount: z
    .number()
    .describe("Number of records selected by offset and limit"),
  addedCount: z
    .number()
    .describe("Number of records actually added to kintone (0 for a dry run)"),
  skippedFieldCodes: z
    .array(z.string())
    .describe(
      "Field codes dropped before sending, because kintone rejects them on record creation or they do not exist in the app",
    ),
  dryRun: z.boolean().describe("Whether this run was a validation-only run"),
};

const toolName = "kintone-import-records-from-file";
const toolConfig = {
  title: "Import Records from File",
  description:
    "Add records to a kintone app in bulk by reading them from a local JSON file, WITHOUT loading the record contents into the conversation. " +
    "Use this to register datasets that were prepared or exported as a file, instead of passing every record through the LLM. " +
    'The file may be a JSON array of records or an object holding them under a "records" key, and each field may use the retrieval format ({ "type": ..., "value": ... }) or the registration format ({ "value": ... }). Numeric values may be written as a JSON string ("12") or a JSON number (12). Use kintone-get-form-fields first to discover the field codes and formats the app expects when the file still has to be written. ' +
    "The app form settings are read first, and every field kintone rejects on record creation is dropped before sending: record number, record ID, revision, calculated fields, auto-calculated single-line text, lookup copy destinations, category, status, assignee, related records, creator/modifier and their timestamps, plus field codes that do not exist in the app. " +
    'For FILE fields, upload each file with kintone-upload-file first and write value: [{ "fileKey": "..." }]; attachment values taken from record retrieval cannot be re-registered and are dropped. Table rows are always added as new rows. Dropped field codes are reported in skippedFieldCodes. ' +
    "All records are validated before anything is sent, then added in batches of 100 (the kintone API limit). kintone rolls back a failed batch, but batches already committed are kept, so a failure reports how many records were added and the file index to resume from with offset. " +
    "Requires the record add permission on the app; set dryRun to validate a file without writing.",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { app, filePath, offset, limit, dryRun },
  { client, attachmentsDir },
) => {
  const { resolvedPath, rawRecords } = readRawRecordsFromFile(
    filePath,
    attachmentsDir,
  );

  const { startIndex, targets } = selectTargetRecords(
    rawRecords,
    { offset, limit },
    resolvedPath,
  );

  const parsedRecords: RecordFromFile[] = [];
  const issues: string[] = [];
  targets.forEach((target, index) => {
    const parsed = recordSchemaFromFile.safeParse(target);
    if (!parsed.success) {
      issues.push(
        describeParseFailure(parsed.error, `record #${startIndex + index}`),
      );
      return;
    }
    parsedRecords.push(parsed.data);
  });
  if (issues.length > 0) {
    throw new Error(
      buildIssueMessage(
        `${resolvedPath} contains records that are not valid kintone record objects. No record was added.`,
        issues,
      ),
    );
  }

  const { properties } = await client.app.getFormFields({ app });
  const writableFields = buildWritableFields(properties);

  const skippedFieldCodes = new Set<string>();
  const recordsToAdd: RecordForWrite[] = parsedRecords.map((record, index) =>
    normalizeRecord(record, {
      writableFields,
      keepSubtableRowIds: false,
      skippedFieldCodes,
      issues,
      recordLabel: `record #${startIndex + index}`,
    }),
  );
  if (issues.length > 0) {
    throw new Error(
      buildIssueMessage(
        `${resolvedPath} contains field values that do not match the form settings of app ${app}. No record was added.`,
        issues,
      ),
    );
  }

  let addedCount = 0;
  if (!dryRun) {
    for (
      let index = 0;
      index < recordsToAdd.length;
      index += MAX_RECORDS_PER_REQUEST
    ) {
      const batch = recordsToAdd.slice(index, index + MAX_RECORDS_PER_REQUEST);
      try {
        const response = await client.record.addRecords({
          app,
          records: batch,
        });
        addedCount += response.ids.length;
      } catch (error) {
        throw new Error(
          `Failed to add the batch starting at record #${startIndex + index}. ` +
            `${addedCount} record(s) were already added and are not rolled back; the failed batch was rolled back by kintone. ` +
            `Fix the data and resume with offset ${startIndex + index}. ` +
            `Cause: ${describeCause(error)}`,
        );
      }
    }
  }

  const result = {
    app,
    filePath: resolvedPath,
    totalRecordsInFile: rawRecords.length,
    targetRecordCount: recordsToAdd.length,
    addedCount,
    skippedFieldCodes: [...skippedFieldCodes].sort(),
    dryRun: dryRun ?? false,
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

export const importRecordsFromFile = createTool(toolName, toolConfig, callback);
