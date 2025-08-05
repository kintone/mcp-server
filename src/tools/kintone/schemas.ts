import { z } from "zod";

// kintoneレコードのフィールド値用共通スキーマ
export const recordInputSchema = z.record(
  z.union([
    // 文字列系フィールド (SINGLE_LINE_TEXT, MULTI_LINE_TEXT, RICH_TEXT, LINK, MOBILE, EMAIL, URL, PASSWORD)
    z.object({
      value: z
        .string()
        .nullable()
        .describe(
          "Text value for string fields (SINGLE_LINE_TEXT, MULTI_LINE_TEXT, RICH_TEXT, LINK, MOBILE, EMAIL, URL, PASSWORD)",
        ),
    }),
    // 数値フィールド (NUMBER) - 文字列として送信
    z.object({
      value: z
        .string()
        .nullable()
        .describe("Numeric value as string for NUMBER fields (e.g., '123.45')"),
    }),
    // 日付・時間系フィールド (DATE, TIME, DATETIME)
    z.object({
      value: z
        .string()
        .nullable()
        .describe(
          "Date/time value for DATE, TIME, DATETIME fields (DATE: 'YYYY-MM-DD', TIME: 'HH:mm', DATETIME: 'YYYY-MM-DDTHH:mm:ssZ')",
        ),
    }),
    // 単一選択フィールド (RADIO_BUTTON, DROP_DOWN)
    z.object({
      value: z
        .string()
        .nullable()
        .describe(
          "Selected option value for RADIO_BUTTON and DROP_DOWN fields",
        ),
    }),
    // 複数選択系フィールド (CHECK_BOX, MULTI_SELECT)
    z.object({
      value: z
        .array(z.string())
        .min(0)
        .nullable()
        .describe(
          "Array of selected option values for CHECK_BOX and MULTI_SELECT fields",
        ),
    }),
    // ユーザー選択フィールド (USER_SELECT)
    z.object({
      value: z
        .array(
          z.object({
            code: z.string().describe("User code/login name"),
          }),
        )
        .nullable()
        .describe("Array of selected users for USER_SELECT fields"),
    }),
    // 組織選択フィールド (ORGANIZATION_SELECT)
    z.object({
      value: z
        .array(
          z.object({
            code: z.string().describe("Organization code"),
          }),
        )
        .nullable()
        .describe(
          "Array of selected organizations for ORGANIZATION_SELECT fields",
        ),
    }),
    // グループ選択フィールド (GROUP_SELECT)
    z.object({
      value: z
        .array(
          z.object({
            code: z.string().describe("Group code"),
          }),
        )
        .nullable()
        .describe("Array of selected groups for GROUP_SELECT fields"),
    }),
    // ファイルフィールド (FILE)
    z.object({
      value: z
        .array(
          z.object({
            fileKey: z
              .string()
              .describe("File key obtained from file upload API"),
          }),
        )
        .nullable()
        .describe("Array of uploaded files for FILE fields"),
    }),
    // 作成者・更新者フィールド (CREATOR, MODIFIER) - 登録時はcodeのみ
    z.object({
      value: z
        .object({
          code: z.string().describe("User code/login name"),
        })
        .nullable()
        .describe(
          "User information for CREATOR and MODIFIER fields (registration format with code only)",
        ),
    }),
    // サブテーブルフィールド (SUBTABLE)
    z.object({
      value: z
        .array(
          z.object({
            id: z
              .string()
              .optional()
              .describe("Row ID (optional for new rows)"),
            value: z
              .record(z.any())
              .describe("Field values within this subtable row"),
          }),
        )
        .nullable()
        .describe("Array of subtable rows for SUBTABLE fields"),
    }),
    // ルックアップフィールド (LOOKUP) - キー項目の型に応じて文字列または数値文字列
    z.object({
      value: z
        .string()
        .nullable()
        .describe(
          "Lookup field value for LOOKUP fields (string for SINGLE_LINE_TEXT key, numeric string for NUMBER key)",
        ),
    }),
    // 作成日時・更新日時フィールド (CREATED_TIME, UPDATED_TIME) - 登録時のみ指定可能
    z.object({
      value: z
        .string()
        .nullable()
        .describe(
          "Date/time value for CREATED_TIME and UPDATED_TIME fields (ISO 8601 format, only for registration)",
        ),
    }),
  ]),
);
