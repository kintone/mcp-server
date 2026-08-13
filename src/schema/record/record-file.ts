import { z } from "zod";

/**
 * Shape of a kintone record as it is written in a local JSON file: either the
 * retrieval format ({ type, value }) or the registration format ({ value }).
 */
const fieldTypeSchema = z.enum([
  "RECORD_NUMBER",
  "__ID__",
  "__REVISION__",
  "CREATOR",
  "CREATED_TIME",
  "MODIFIER",
  "UPDATED_TIME",
  "SINGLE_LINE_TEXT",
  "MULTI_LINE_TEXT",
  "RICH_TEXT",
  "NUMBER",
  "CALC",
  "CHECK_BOX",
  "RADIO_BUTTON",
  "MULTI_SELECT",
  "DROP_DOWN",
  "USER_SELECT",
  "ORGANIZATION_SELECT",
  "GROUP_SELECT",
  "DATE",
  "TIME",
  "DATETIME",
  "LINK",
  "FILE",
  "SUBTABLE",
  "REFERENCE_TABLE",
  "CATEGORY",
  "STATUS",
  "STATUS_ASSIGNEE",
  "GROUP",
  "LABEL",
  "SPACER",
  "HR",
]);

/**
 * Record ids, revisions and table row ids are strings in a record read from
 * kintone, but the REST API takes a number just as well (RecordID and Revision
 * are string | number), and a hand-written or generated file often holds the
 * JSON number. Both are accepted and normalized to the string form.
 */
export const numericIdFromFileSchema = z
  .union([z.string(), z.number()], {
    // A plain union reports "Invalid input", which hides what was expected.
    errorMap: () => ({
      message: "must be a numeric value, written as a string or a number",
    }),
  })
  .transform((value) => String(value));

const codeEntrySchema = z.object({
  code: z.string(),
  name: z.string().optional(),
});

const fileEntrySchema = z.object({
  fileKey: z.string(),
  contentType: z.string().optional(),
  name: z.string().optional(),
  // Only read to tell a retrieved attachment from an upload key, never sent.
  size: z.union([z.string(), z.number()]).optional(),
});

const cellValueSchema = z.union([
  z.string(),
  z.number(),
  z.array(z.string()),
  codeEntrySchema,
  z.array(codeEntrySchema),
  z.array(fileEntrySchema),
  z.null(),
]);

const subtableRowSchema = z.object({
  id: numericIdFromFileSchema.optional(),
  value: z.record(
    z.object({
      type: fieldTypeSchema.optional(),
      value: cellValueSchema,
    }),
  ),
});

export const recordSchemaFromFile = z.record(
  z.object({
    type: fieldTypeSchema.optional(),
    value: z.union([cellValueSchema, z.array(subtableRowSchema)]),
  }),
);

export type RecordFromFile = z.infer<typeof recordSchemaFromFile>;
export type CellValueFromFile = z.infer<typeof cellValueSchema>;
export type SubtableRowFromFile = z.infer<typeof subtableRowSchema>;
export type FieldValueFromFile = RecordFromFile[string]["value"];
