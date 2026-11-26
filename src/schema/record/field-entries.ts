import { z } from "zod";
import type { KintoneRestAPIClient } from "@kintone/rest-api-client";
import { withoutAdvertisedRequired } from "../without-advertised-required.js";

type RecordForParameter = Parameters<
  KintoneRestAPIClient["record"]["addRecords"]
>[0]["records"][number];

const entitySchema = z.object({
  code: z.string().describe("User, organization, or group code"),
});

const cellValueBranches = [
  z
    .string()
    .describe(
      "Text for SINGLE_LINE_TEXT, MULTI_LINE_TEXT, RICH_TEXT, LINK, RADIO_BUTTON, DROP_DOWN, and LOOKUP fields. NUMBER as a numeric string (e.g. '123.45'). DATE as 'YYYY-MM-DD', TIME as 'HH:mm', DATETIME, CREATED_TIME, and UPDATED_TIME as ISO 8601 (e.g. '2025-01-01T13:30:00Z'). Use an empty string to leave the field empty",
    ),
  z
    .array(z.string())
    .describe("Selected options for CHECK_BOX and MULTI_SELECT fields"),
  z
    .array(entitySchema)
    .describe(
      "Selected entities for USER_SELECT, ORGANIZATION_SELECT, and GROUP_SELECT fields",
    ),
  entitySchema.describe("User for CREATOR and MODIFIER fields"),
] as const;

const fieldCodeSchema = z.string().describe("Field code");

const rejectDuplicateFieldCodes = (
  entries: ReadonlyArray<{ readonly fieldCode: string }>,
  ctx: z.RefinementCtx,
) => {
  const seen = new Set<string>();
  entries.forEach(({ fieldCode }, index) => {
    if (seen.has(fieldCode)) {
      ctx.addIssue({
        code: "custom",
        message: `Duplicate fieldCode "${fieldCode}". Each field code can appear only once`,
        path: [index, "fieldCode"],
      });
    }
    seen.add(fieldCode);
  });
};

const cellEntrySchema = z.object({
  fieldCode: fieldCodeSchema,
  value: z.union(cellValueBranches).describe("Value of the field in the row"),
});

const subtableRowSchema = z.object({
  id: z
    .string()
    .describe('Row ID (numeric value as string). Use "" for a new row'),
  fields: z
    .array(withoutAdvertisedRequired(cellEntrySchema))
    .superRefine(rejectDuplicateFieldCodes)
    .describe("Field values in the row"),
});

const fieldEntrySchema = z.object({
  fieldCode: fieldCodeSchema,
  value: z
    .union([
      ...cellValueBranches,
      z
        .array(withoutAdvertisedRequired(subtableRowSchema))
        .describe("Rows for SUBTABLE fields"),
    ])
    .describe(
      "Value in the shape the field type expects. Use kintone-get-form-fields tool first to discover field types",
    ),
});

/**
 * Field values of one record, given as `{ fieldCode, value }` entries so that
 * every entry has the same keys.
 */
export const fieldEntriesSchema = z
  .array(withoutAdvertisedRequired(fieldEntrySchema))
  .superRefine(rejectDuplicateFieldCodes)
  .describe(
    "Field values of the record. Omit fields you do not set instead of passing empty values",
  );

type FieldEntry = z.output<typeof fieldEntrySchema>;
type FieldValue = FieldEntry["value"];
type SubtableRow = z.output<typeof subtableRowSchema>;

const isSubtableRows = (value: FieldValue): value is SubtableRow[] =>
  Array.isArray(value) &&
  value.every((item) => typeof item === "object" && "fields" in item);

const toKintoneRecord = (
  entries: ReadonlyArray<{
    readonly fieldCode: string;
    readonly value: unknown;
  }>,
): RecordForParameter =>
  Object.fromEntries(
    entries.map(({ fieldCode, value }) => [fieldCode, { value }]),
  );

/**
 * Converts `{ fieldCode, value }` entries into the record shape the kintone
 * REST API takes, dropping the ID of subtable rows given as "".
 *
 * @param entries - Field entries validated by `fieldEntriesSchema`
 * @returns The record keyed by field code
 */
export const toRecordForParameter = (
  entries: readonly FieldEntry[],
): RecordForParameter =>
  toKintoneRecord(
    entries.map(({ fieldCode, value }) => ({
      fieldCode,
      value: isSubtableRows(value)
        ? value.map(({ id, fields }) => ({
            ...(id === "" ? {} : { id }),
            value: toKintoneRecord(fields),
          }))
        : value,
    })),
  );
