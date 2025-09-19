import { z } from "zod";

// フィールドタイプの定義
const fieldTypeSchema = z.union([
  z.literal("SINGLE_LINE_TEXT").describe("Text or Look-up field"),
  z.literal("MULTI_LINE_TEXT").describe("Text Area field"),
  z.literal("RICH_TEXT").describe("Rich text field"),
  z.literal("NUMBER").describe("Number or Look-up field"),
  z.literal("CALC").describe("Calculated field"),
  z.literal("RADIO_BUTTON").describe("Radio button field"),
  z.literal("CHECK_BOX").describe("Check box field"),
  z.literal("MULTI_SELECT").describe("Multi-choice field"),
  z.literal("DROP_DOWN").describe("Drop-down field"),
  z.literal("USER_SELECT").describe("User selection field"),
  z.literal("ORGANIZATION_SELECT").describe("Department selection field"),
  z.literal("GROUP_SELECT").describe("Group selection field"),
  z.literal("DATE").describe("Date field"),
  z.literal("TIME").describe("Time field"),
  z.literal("DATETIME").describe("Date and time field"),
  z.literal("LINK").describe("Link field"),
  z.literal("FILE").describe("Attachment field"),
  z.literal("SUBTABLE").describe("Table field"),
  z.literal("RECORD_NUMBER").describe("Record number field"),
  z.literal("CREATOR").describe("Created by field"),
  z.literal("CREATED_TIME").describe("Created datetime field"),
  z.literal("MODIFIER").describe("Updated by field"),
  z.literal("UPDATED_TIME").describe("Updated datetime field"),
  z.literal("STATUS").describe("Process management status field"),
  z
    .literal("STATUS_ASSIGNEE")
    .describe("Assignee of the Process Management status field"),
  z.literal("CATEGORY").describe("Category field"),
  z.literal("REFERENCE_TABLE").describe("Related Records field"),
  z.literal("GROUP").describe("Field group"),
  z.literal("LABEL").describe("Label field"),
  z.literal("SPACER").describe("Blank space field"),
  z.literal("HR").describe("Border field"),
]);

// サイズ設定スキーマ
const sizeSchema = z
  .object({
    width: z
      .union([z.string(), z.number()])
      .optional()
      .describe("Field width in pixels"),
    height: z
      .union([z.string(), z.number()])
      .optional()
      .describe(
        "Field height (only applicable for specific fields like Blank space and Text Area)",
      ),
    innerHeight: z
      .union([z.string(), z.number()])
      .optional()
      .describe("Inner height for multi-line text fields"),
  })
  .optional()
  .describe("Width and height configurations for fields");

// パラメータ用のフィールドスキーマ
const fieldForParameterSchema = z.object({
  type: fieldTypeSchema.describe("The field type"),
  code: z
    .string()
    .optional()
    .describe(
      "Field code (required for most field types except LABEL, SPACER, and HR)",
    ),
  label: z
    .string()
    .optional()
    .describe("Text to set for Label fields (only used with Label field type)"),
  elementId: z
    .string()
    .optional()
    .describe(
      "Element ID for Blank space fields (only used with Blank space field type)",
    ),
  size: sizeSchema,
});

// ROW レイアウトパラメータ
const rowLayoutForParameterSchema = z.object({
  type: z.literal("ROW").describe("A normal row of fields"),
  fields: z
    .array(fieldForParameterSchema)
    .describe("List of field layouts in the row"),
});

// SUBTABLE レイアウトパラメータ
const subtableLayoutForParameterSchema = z.object({
  type: z.literal("SUBTABLE").describe("A Table"),
  code: z.string().describe("The field code of the Table"),
  fields: z
    .array(fieldForParameterSchema)
    .describe("List of field layouts in the Table"),
});

// GROUP レイアウトパラメータ
const groupLayoutForParameterSchema = z.object({
  type: z.literal("GROUP").describe("A Group field"),
  code: z.string().describe("The field code of the Group field"),
  layout: z
    .array(z.lazy(() => rowLayoutForParameterSchema))
    .describe("List of field layouts inside the Group field"),
});

// LayoutForParameter スキーマ
export const layoutForParameterSchema = z
  .array(
    z.union([
      rowLayoutForParameterSchema,
      subtableLayoutForParameterSchema,
      groupLayoutForParameterSchema,
    ]),
  )
  .describe("List of field layouts for the form");
