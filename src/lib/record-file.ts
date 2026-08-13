import fs from "node:fs";
import path from "node:path";
import type { KintoneFormFieldProperty } from "@kintone/rest-api-client";
import type { ZodError } from "zod";
import type {
  CellValueFromFile,
  FieldValueFromFile,
  RecordFromFile,
  SubtableRowFromFile,
} from "../schema/record/index.js";

/** Maximum number of records kintone accepts in one add/update request. */
export const MAX_RECORDS_PER_REQUEST = 100;

const MAX_REPORTED_ISSUES = 10;

/** A record in the shape the kintone REST API accepts for add and update. */
export type RecordForWrite = { [fieldCode: string]: { value: unknown } };

export type WritableField = {
  type: string;
  subtableFields?: Map<string, string>;
};

export type WritableFields = Map<string, WritableField>;

/**
 * Field types kintone rejects on record creation and update. Creator, modifier
 * and their timestamps are registrable on creation but need app management
 * permission, so they are dropped as well to keep a run possible with the
 * record add or edit permission alone.
 */
const NON_WRITABLE_FIELD_TYPES = new Set([
  "RECORD_NUMBER",
  "__ID__",
  "__REVISION__",
  "CREATOR",
  "CREATED_TIME",
  "MODIFIER",
  "UPDATED_TIME",
  "CALC",
  "CATEGORY",
  "STATUS",
  "STATUS_ASSIGNEE",
  "REFERENCE_TABLE",
  "GROUP",
  "LABEL",
  "SPACER",
  "HR",
]);

const CODE_ENTRY_FIELD_TYPES = new Set([
  "USER_SELECT",
  "ORGANIZATION_SELECT",
  "GROUP_SELECT",
]);

type FieldResult =
  | { kind: "value"; value: unknown }
  | { kind: "skip" }
  | { kind: "issue"; message: string };

const isWritableFieldProperty = (
  field: KintoneFormFieldProperty.OneOf | KintoneFormFieldProperty.InSubtable,
  lookupCopyDestinations: Set<string>,
): boolean => {
  if (NON_WRITABLE_FIELD_TYPES.has(field.type)) {
    return false;
  }
  if (lookupCopyDestinations.has(field.code)) {
    return false;
  }
  if (
    field.type === "SINGLE_LINE_TEXT" &&
    "expression" in field &&
    field.expression !== ""
  ) {
    return false;
  }
  return true;
};

const collectLookupCopyDestinations = (properties: {
  [fieldCode: string]: KintoneFormFieldProperty.OneOf;
}): Set<string> => {
  const destinations = new Set<string>();
  const collect = (
    field: KintoneFormFieldProperty.OneOf | KintoneFormFieldProperty.InSubtable,
  ) => {
    if ("lookup" in field) {
      for (const mapping of field.lookup.fieldMappings) {
        destinations.add(mapping.field);
      }
    }
  };

  for (const field of Object.values(properties)) {
    collect(field);
    if (field.type === "SUBTABLE") {
      for (const innerField of Object.values(field.fields)) {
        collect(innerField);
      }
    }
  }
  return destinations;
};

/**
 * Build the set of fields that can carry a value on record add and update,
 * based on the form settings of the target app.
 */
export const buildWritableFields = (properties: {
  [fieldCode: string]: KintoneFormFieldProperty.OneOf;
}): WritableFields => {
  const lookupCopyDestinations = collectLookupCopyDestinations(properties);
  const writableFields: WritableFields = new Map();

  for (const [code, field] of Object.entries(properties)) {
    if (!isWritableFieldProperty(field, lookupCopyDestinations)) {
      continue;
    }
    if (field.type === "SUBTABLE") {
      const subtableFields = new Map<string, string>();
      for (const [innerCode, innerField] of Object.entries(field.fields)) {
        if (isWritableFieldProperty(innerField, lookupCopyDestinations)) {
          subtableFields.set(innerCode, innerField.type);
        }
      }
      writableFields.set(code, { type: field.type, subtableFields });
      continue;
    }
    writableFields.set(code, { type: field.type });
  }

  return writableFields;
};

const toCodeEntries = (
  value: CellValueFromFile,
): Array<{ code: string }> | null => {
  if (value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    return null;
  }
  const entries: Array<{ code: string }> = [];
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null || !("code" in entry)) {
      return null;
    }
    entries.push({ code: entry.code });
  }
  return entries;
};

const isSubtableRows = (
  value: FieldValueFromFile,
): value is SubtableRowFromFile[] =>
  Array.isArray(value) &&
  value.some(
    (entry) => typeof entry === "object" && entry !== null && "value" in entry,
  );

const normalizeCellValue = (
  fieldCode: string,
  fieldType: string,
  value: FieldValueFromFile,
): FieldResult => {
  if (isSubtableRows(value)) {
    return {
      kind: "issue",
      message: `field "${fieldCode}" holds table rows, but it is a ${fieldType} field in the app`,
    };
  }

  if (CODE_ENTRY_FIELD_TYPES.has(fieldType)) {
    const entries = toCodeEntries(value);
    if (entries === null) {
      return {
        kind: "issue",
        message: `field "${fieldCode}" (${fieldType}) must be an array of objects with a code property`,
      };
    }
    return { kind: "value", value: entries };
  }

  if (fieldType === "FILE") {
    if (value === null) {
      return { kind: "value", value: [] };
    }
    if (!Array.isArray(value)) {
      return {
        kind: "issue",
        message: `field "${fieldCode}" (FILE) must be an array of objects with a fileKey property`,
      };
    }
    const fileKeys: Array<{ fileKey: string }> = [];
    for (const entry of value) {
      if (
        typeof entry !== "object" ||
        entry === null ||
        !("fileKey" in entry)
      ) {
        return {
          kind: "issue",
          message: `field "${fieldCode}" (FILE) must be an array of objects with a fileKey property`,
        };
      }
      // fileKeys read from a record cannot be re-registered, only upload keys can.
      if (entry.contentType !== undefined || entry.size !== undefined) {
        return { kind: "skip" };
      }
      fileKeys.push({ fileKey: entry.fileKey });
    }
    return { kind: "value", value: fileKeys };
  }

  if (typeof value === "number") {
    return { kind: "value", value: String(value) };
  }

  return { kind: "value", value };
};

const normalizeSubtableValue = (
  fieldCode: string,
  value: FieldValueFromFile,
  subtableFields: Map<string, string>,
  keepRowIds: boolean,
  skippedFieldCodes: Set<string>,
): FieldResult => {
  if (value === null) {
    return { kind: "value", value: [] };
  }
  if (!Array.isArray(value)) {
    return {
      kind: "issue",
      message: `field "${fieldCode}" (SUBTABLE) must be an array of table rows`,
    };
  }

  const rows: Array<{ id?: string; value: RecordForWrite }> = [];
  for (const row of value) {
    if (typeof row !== "object" || row === null || !("value" in row)) {
      return {
        kind: "issue",
        message: `field "${fieldCode}" (SUBTABLE) must be an array of table rows`,
      };
    }
    const cells: RecordForWrite = {};
    for (const [cellCode, cell] of Object.entries(row.value)) {
      const cellType = subtableFields.get(cellCode);
      if (cellType === undefined) {
        skippedFieldCodes.add(cellCode);
        continue;
      }
      const result = normalizeCellValue(cellCode, cellType, cell.value);
      if (result.kind === "issue") {
        return result;
      }
      if (result.kind === "skip") {
        skippedFieldCodes.add(cellCode);
        continue;
      }
      cells[cellCode] = { value: result.value };
    }
    rows.push(
      keepRowIds && row.id !== undefined
        ? { id: row.id, value: cells }
        : { value: cells },
    );
  }

  return { kind: "value", value: rows };
};

export type NormalizeRecordOptions = {
  writableFields: WritableFields;
  /**
   * Keep table row ids. kintone updates the row with that id, and creates a new
   * row when the id is omitted, so ids are kept on update and dropped on add.
   */
  keepSubtableRowIds: boolean;
  skippedFieldCodes: Set<string>;
  issues: string[];
  recordLabel: string;
};

/**
 * Turn a record read from a file into the shape kintone accepts, dropping the
 * fields it rejects and collecting what was dropped or looks wrong.
 */
export const normalizeRecord = (
  record: RecordFromFile,
  {
    writableFields,
    keepSubtableRowIds,
    skippedFieldCodes,
    issues,
    recordLabel,
  }: NormalizeRecordOptions,
): RecordForWrite => {
  const normalized: RecordForWrite = {};

  for (const [fieldCode, field] of Object.entries(record)) {
    const writableField = writableFields.get(fieldCode);
    if (writableField === undefined) {
      skippedFieldCodes.add(fieldCode);
      continue;
    }

    const result =
      writableField.subtableFields !== undefined
        ? normalizeSubtableValue(
            fieldCode,
            field.value,
            writableField.subtableFields,
            keepSubtableRowIds,
            skippedFieldCodes,
          )
        : normalizeCellValue(fieldCode, writableField.type, field.value);

    if (result.kind === "issue") {
      issues.push(`${recordLabel}: ${result.message}`);
      continue;
    }
    if (result.kind === "skip") {
      skippedFieldCodes.add(fieldCode);
      continue;
    }
    normalized[fieldCode] = { value: result.value };
  }

  return normalized;
};

const extractRawRecords = (parsed: unknown): unknown[] | null => {
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "records" in parsed &&
    Array.isArray(parsed.records)
  ) {
    return parsed.records;
  }
  return null;
};

export const resolveRecordFilePath = (
  filePath: string,
  attachmentsDir: string | undefined,
): string => {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  if (!attachmentsDir) {
    throw new Error(
      `filePath must be an absolute path unless KINTONE_ATTACHMENTS_DIR is set: ${filePath}`,
    );
  }
  return path.resolve(attachmentsDir, filePath);
};

/**
 * Read a JSON file holding kintone records, accepting both a plain array and an
 * object with a "records" array. Entries are returned unvalidated so that each
 * tool can apply the shape it expects.
 */
export const readRawRecordsFromFile = (
  filePath: string,
  attachmentsDir: string | undefined,
): { resolvedPath: string; rawRecords: unknown[] } => {
  const resolvedPath = resolveRecordFilePath(filePath, attachmentsDir);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  const fileContent = fs.readFileSync(resolvedPath, "utf-8");
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(fileContent);
  } catch (error) {
    throw new Error(
      `Failed to parse ${resolvedPath} as JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const rawRecords = extractRawRecords(parsedJson);
  if (rawRecords === null) {
    throw new Error(
      `${resolvedPath} must contain a JSON array of records or an object with a "records" array`,
    );
  }

  return { resolvedPath, rawRecords };
};

/**
 * Cut the slice of a file the run works on. kintone needs at least one record
 * per request, so an empty selection is reported instead of writing nothing.
 */
export const selectTargetRecords = (
  rawRecords: unknown[],
  options: { offset: number | undefined; limit: number | undefined },
  resolvedPath: string,
): { startIndex: number; targets: unknown[] } => {
  const { offset, limit } = options;
  const startIndex = offset ?? 0;
  const targets = rawRecords.slice(
    startIndex,
    limit === undefined ? undefined : startIndex + limit,
  );

  if (targets.length === 0) {
    const window =
      limit === undefined
        ? `offset ${startIndex}`
        : `offset ${startIndex} with limit ${limit}`;
    throw new Error(
      `No record was selected from ${resolvedPath}: it holds ${rawRecords.length} record(s), and ${window} selects none.`,
    );
  }

  return { startIndex, targets };
};

export const buildIssueMessage = (
  summary: string,
  issues: string[],
): string => {
  const reported = issues.slice(0, MAX_REPORTED_ISSUES);
  const remaining = issues.length - reported.length;
  const suffix = remaining > 0 ? `\n...and ${remaining} more issue(s)` : "";
  return `${summary}\n${reported.join("\n")}${suffix}`;
};

export const describeCause = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/** Point at the first schema violation of an entry read from a file. */
export const describeParseFailure = (
  error: ZodError,
  recordLabel: string,
): string => {
  const issue = error.issues[0];
  return `${recordLabel}: ${issue.path.join(".") || "(root)"} ${issue.message}`;
};
