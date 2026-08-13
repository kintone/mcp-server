import { z } from "zod";
import { createTool } from "../../factory.js";
import {
  numericIdFromFileSchema,
  recordSchemaFromFile,
} from "../../../schema/record/index.js";
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
import type {
  RecordForWrite,
  WritableFields,
} from "../../../lib/record-file.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const inputSchema = {
  app: z.string().describe('App ID (numeric string). e.g. "123"'),
  filePath: z
    .string()
    .describe(
      "Path to the JSON file holding the records to update. Absolute path, or a file name resolved against KINTONE_ATTACHMENTS_DIR.",
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
      "Maximum number of records to update. Omit to update every record after offset.",
    ),
  dryRun: z
    .boolean()
    .optional()
    .describe(
      "When true, validate the file against the app form settings without updating any record. Defaults to false.",
    ),
};

const outputSchema = {
  app: z.string().describe("The app ID whose records were updated"),
  filePath: z.string().describe("Absolute path to the JSON file that was read"),
  totalRecordsInFile: z
    .number()
    .describe("Number of records contained in the file"),
  targetRecordCount: z
    .number()
    .describe("Number of records selected by offset and limit"),
  updatedCount: z
    .number()
    .describe("Number of records actually updated (0 for a dry run)"),
  skippedFieldCodes: z
    .array(z.string())
    .describe(
      "Field codes dropped before sending, because kintone rejects them on record update or they do not exist in the app",
    ),
  dryRun: z.boolean().describe("Whether this run was a validation-only run"),
};

/**
 * Entry shape accepted in addition to a plain record: the same shape
 * kintone-update-records takes, so a file can carry the record id and the
 * expected revision next to the values. updateKey is out of scope.
 */
const updateEntrySchema = z.object({
  id: numericIdFromFileSchema,
  record: recordSchemaFromFile,
  revision: numericIdFromFileSchema.optional(),
});

type UpdateTarget = {
  id: string;
  record: RecordForWrite;
  revision?: string;
};

const RECORD_ID_FIELD_CODE = "$id";
const REVISION_FIELD_CODE = "$revision";

const isKeyedEntry = (entry: unknown): boolean =>
  typeof entry === "object" &&
  entry !== null &&
  "record" in entry &&
  "id" in entry;

const takeRecordIdFieldValue = (record: RecordFromFile): string | null => {
  const field = record[RECORD_ID_FIELD_CODE];
  if (field === undefined) {
    return null;
  }
  if (typeof field.value === "string") {
    return field.value;
  }
  if (typeof field.value === "number") {
    return String(field.value);
  }
  return null;
};

type ParsedEntry = {
  record: RecordFromFile;
  id: string;
  revision?: string;
  recordLabel: string;
};

const readKeyedEntry = (
  entry: unknown,
  issues: string[],
  recordLabel: string,
): ParsedEntry | null => {
  const parsed = updateEntrySchema.safeParse(entry);
  if (!parsed.success) {
    issues.push(describeParseFailure(parsed.error, recordLabel));
    return null;
  }

  const { id, record, revision } = parsed.data;
  dropRecordKeyFields(record);
  return { record, id, revision, recordLabel };
};

const readPlainRecord = (
  entry: unknown,
  issues: string[],
  recordLabel: string,
): ParsedEntry | null => {
  const parsed = recordSchemaFromFile.safeParse(entry);
  if (!parsed.success) {
    issues.push(describeParseFailure(parsed.error, recordLabel));
    return null;
  }

  const record = parsed.data;
  const id = takeRecordIdFieldValue(record);
  if (id === null) {
    issues.push(
      `${recordLabel}: no record id found. Put the record id in "$id", or use the { "id": ..., "record": ... } form.`,
    );
    return null;
  }

  // A revision copied along by an export is not an intentional expectation, so
  // it is ignored. Use the { "id": ..., "revision": ... } form to check it.
  dropRecordKeyFields(record);
  return { record, id, recordLabel };
};

/** The record id and revision identify a record instead of holding a value. */
const dropRecordKeyFields = (record: RecordFromFile): void => {
  delete record[RECORD_ID_FIELD_CODE];
  delete record[REVISION_FIELD_CODE];
};

const parseEntry = (
  entry: unknown,
  recordLabel: string,
  issues: string[],
): ParsedEntry | null =>
  isKeyedEntry(entry)
    ? readKeyedEntry(entry, issues, recordLabel)
    : readPlainRecord(entry, issues, recordLabel);

const buildUpdateTarget = (
  entry: ParsedEntry,
  options: {
    writableFields: WritableFields;
    skippedFieldCodes: Set<string>;
    issues: string[];
  },
): UpdateTarget => {
  const { writableFields, skippedFieldCodes, issues } = options;

  const record = normalizeRecord(entry.record, {
    writableFields,
    keepSubtableRowIds: true,
    skippedFieldCodes,
    issues,
    recordLabel: entry.recordLabel,
  });

  return { id: entry.id, record, revision: entry.revision };
};

const toolName = "kintone-update-records-from-file";
const toolConfig = {
  title: "Update Records from File",
  description:
    "Update records of a kintone app in bulk by reading them from a local JSON file, WITHOUT loading the record contents into the conversation. " +
    "Use this to apply datasets that were exported and edited as a file, instead of passing every record through the LLM. " +
    'The file may be a JSON array or an object holding the entries under a "records" key. An entry is either a plain record, whose record id is taken from "$id" and whose "$revision" is ignored, or an object of the form { "id": ..., "record": { ... }, "revision": ... } where revision is the expected revision number and the update fails when it does not match; specify -1 or omit it to skip revision validation. Record ids, revisions and table row ids may be written as a JSON string ("12") or a JSON number (12). Each field may use the retrieval format ({ "type": ..., "value": ... }) or the registration format ({ "value": ... }). Use kintone-get-form-fields first to discover the field codes and formats the app expects when the file still has to be written. ' +
    "Records are matched by record ID only, and records that do not exist are never created: the update fails instead. " +
    "The app form settings are read first, and every field kintone rejects on record update is dropped before sending: record number, record ID, revision, calculated fields, auto-calculated single-line text, lookup copy destinations, category, status, assignee, related records, creator/modifier and their timestamps, plus field codes that do not exist in the app. " +
    "Fields absent from an entry keep their current value, but a table included in an entry replaces the whole table: rows keep their row id and existing rows missing from the entry are deleted. " +
    'For FILE fields, upload each file with kintone-upload-file first and write value: [{ "fileKey": "..." }]; attachment values taken from record retrieval cannot be re-registered and are dropped. Dropped field codes are reported in skippedFieldCodes. ' +
    "All entries are validated before anything is sent, then updated in batches of 100 (the kintone API limit). kintone rolls back a failed batch, but batches already committed are kept, so a failure reports how many records were updated and the file index to resume from with offset. " +
    "Requires the record edit permission on the app; set dryRun to validate a file without writing.",
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

  const issues: string[] = [];
  const parsedEntries: ParsedEntry[] = [];
  targets.forEach((target, index) => {
    const parsed = parseEntry(target, `record #${startIndex + index}`, issues);
    if (parsed !== null) {
      parsedEntries.push(parsed);
    }
  });
  if (issues.length > 0) {
    throw new Error(
      buildIssueMessage(
        `${resolvedPath} contains entries that are not valid kintone record objects. No record was updated.`,
        issues,
      ),
    );
  }

  const { properties } = await client.app.getFormFields({ app });
  const writableFields = buildWritableFields(properties);

  const skippedFieldCodes = new Set<string>();
  const recordsToUpdate: UpdateTarget[] = parsedEntries.map((entry) =>
    buildUpdateTarget(entry, {
      writableFields,
      skippedFieldCodes,
      issues,
    }),
  );
  if (issues.length > 0) {
    throw new Error(
      buildIssueMessage(
        `${resolvedPath} contains entries that cannot be applied to app ${app}. No record was updated.`,
        issues,
      ),
    );
  }

  let updatedCount = 0;
  if (!dryRun) {
    for (
      let index = 0;
      index < recordsToUpdate.length;
      index += MAX_RECORDS_PER_REQUEST
    ) {
      const batch = recordsToUpdate.slice(
        index,
        index + MAX_RECORDS_PER_REQUEST,
      );
      try {
        const response = await client.record.updateRecords({
          app,
          records: batch,
          upsert: false, // upsertモードは対象外
        });
        updatedCount += response.records.length;
      } catch (error) {
        throw new Error(
          `Failed to update the batch starting at record #${startIndex + index}. ` +
            `${updatedCount} record(s) were already updated and are not rolled back; the failed batch was rolled back by kintone. ` +
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
    targetRecordCount: recordsToUpdate.length,
    updatedCount,
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

export const updateRecordsFromFile = createTool(toolName, toolConfig, callback);
