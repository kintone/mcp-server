import { z } from "zod";

// All field types that have a 'code' property
const fieldTypesWithCode = z.union([
  z.literal("SINGLE_LINE_TEXT").describe("文字列（1行）"),
  z.literal("MULTI_LINE_TEXT").describe("文字列（複数行）"),
  z.literal("NUMBER").describe("数値"),
  z.literal("CALC").describe("計算"),
  z.literal("CHECK_BOX").describe("チェックボックス"),
  z.literal("RADIO_BUTTON").describe("ラジオボタン"),
  z.literal("DROP_DOWN").describe("ドロップダウン"),
  z.literal("MULTI_SELECT").describe("複数選択"),
  z.literal("LINK").describe("リンク"),
  z.literal("DATE").describe("日付"),
  z.literal("TIME").describe("時刻"),
  z.literal("DATETIME").describe("日時"),
  z.literal("FILE").describe("添付ファイル"),
  z.literal("USER_SELECT").describe("ユーザー選択"),
  z.literal("ORGANIZATION_SELECT").describe("組織選択"),
  z.literal("GROUP_SELECT").describe("グループ選択"),
  z.literal("RICH_TEXT").describe("リッチエディター"),
  z.literal("RECORD_NUMBER").describe("レコード番号"),
  z.literal("CREATOR").describe("作成者"),
  z.literal("CREATED_TIME").describe("作成日時"),
  z.literal("MODIFIER").describe("更新者"),
  z.literal("UPDATED_TIME").describe("更新日時"),
  z.literal("REFERENCE_TABLE").describe("関連レコード一覧"),
]);

// Standard field with code
const standardFieldSchema = z.object({
  type: fieldTypesWithCode.describe("The field type"),
  code: z.string().describe("The field code"),
  size: z
    .object({
      width: z.string().describe("Field width"),
      height: z.string().optional().describe("Field height"),
      innerHeight: z
        .string()
        .optional()
        .describe("Inner height for multi-line text"),
    })
    .optional()
    .describe("Field size configuration"),
});

// LABEL field with label property instead of code
const labelFieldSchema = z.object({
  type: z.literal("LABEL").describe("Label field type"),
  label: z.string().describe("The label text"),
  size: z
    .object({
      width: z.string().describe("Field width"),
    })
    .optional()
    .describe("Field size configuration"),
});

// SPACER field with elementId instead of code
const spacerFieldSchema = z.object({
  type: z.literal("SPACER").describe("Spacer field type"),
  elementId: z.string().describe("The element ID"),
  size: z
    .object({
      width: z.string().describe("Field width"),
      height: z.string().optional().describe("Field height"),
    })
    .optional()
    .describe("Field size configuration"),
});

// HR field without code
const hrFieldSchema = z.object({
  type: z.literal("HR").describe("Horizontal rule field type"),
  size: z
    .object({
      width: z.string().describe("Field width"),
    })
    .optional()
    .describe("Field size configuration"),
});

export const layoutFieldSchema = z.union([
  standardFieldSchema,
  labelFieldSchema,
  spacerFieldSchema,
  hrFieldSchema,
]);

export const layoutRowSchema = z.object({
  type: z.literal("ROW").describe("Row type identifier"),
  fields: z.array(layoutFieldSchema).describe("Array of fields in this row"),
});

export const layoutSubtableSchema = z.object({
  type: z.literal("SUBTABLE").describe("Subtable type identifier"),
  code: z.string().describe("Subtable field code"),
  fields: z
    .array(layoutFieldSchema)
    .describe("Array of fields in this subtable"),
});

// Forward declaration for recursive type
interface LayoutElement {
  type: "ROW" | "SUBTABLE" | "GROUP";
  [key: string]: any;
}

export const layoutElementSchema: z.ZodType<LayoutElement> = z.lazy(() =>
  z.union([layoutRowSchema, layoutSubtableSchema, layoutGroupSchema]),
);

export const layoutGroupSchema = z.object({
  type: z.literal("GROUP").describe("Group type identifier"),
  code: z.string().describe("Group field code"),
  layout: z
    .array(layoutElementSchema)
    .describe("Nested layout elements within this group"),
});
