import { z } from "zod";
import { createTool } from "../types.js";
import { getKintoneClient } from "../../client.js";
import { parseKintoneClientConfig } from "../../config.js";

// レコード登録用のスキーマ定義
const recordInputSchema = z.record(
  z.union([
    z.object({
      value: z
        .string()
        .nullable()
        .describe(
          "Text value for string fields (SINGLE_LINE_TEXT, MULTI_LINE_TEXT, RICH_TEXT, LINK, MOBILE, EMAIL, URL, PASSWORD)",
        ),
    }),
    z.object({
      value: z
        .string()
        .nullable()
        .describe("Numeric value as string for NUMBER fields (e.g., '123.45')"),
    }),
    z.object({
      value: z
        .string()
        .nullable()
        .describe(
          "Date/time value for DATE, TIME, DATETIME fields (DATE: 'YYYY-MM-DD', TIME: 'HH:mm', DATETIME: 'YYYY-MM-DDTHH:mm:ssZ')",
        ),
    }),
    z.object({
      value: z
        .string()
        .nullable()
        .describe(
          "Selected option value for RADIO_BUTTON and DROP_DOWN fields",
        ),
    }),
    z.object({
      value: z
        .array(z.string())
        .min(0)
        .nullable()
        .describe(
          "Array of selected option values for CHECK_BOX and MULTI_SELECT fields",
        ),
    }),
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
    // ファイルフィールド (FILE) - ファイルアップロードツール未実装のため現在は指定不可
    // TODO: ファイルアップロードツール実装後に有効化
    // z.object({
    //   value: z
    //     .array(
    //       z.object({
    //         fileKey: z
    //           .string()
    //           .describe("File key obtained from file upload API"),
    //       }),
    //     )
    //     .min(1)
    //     .nullable()
    //     .describe(
    //       "Array of uploaded files for FILE fields (min 1 file required if not null)",
    //     ),
    // }),
    z.object({
      value: z
        .never()
        .describe(
          "FILE fields are not supported yet (file upload tool not implemented)",
        ),
    }),
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
    z.object({
      value: z
        .string()
        .nullable()
        .describe(
          "Lookup field value for LOOKUP fields (string for SINGLE_LINE_TEXT key, numeric string for NUMBER key)",
        ),
    }),
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

const inputSchema = {
  app: z
    .union([z.number(), z.string()])
    .describe("The ID of the app to add records to"),
  records: z
    .array(recordInputSchema)
    .min(1)
    .max(100)
    .describe(
      "Array of records to add (min 1, max 100). Each record is an object with field codes as keys. Use kintone-get-form-fields tool first to discover available field codes and their types.",
    ),
};

const outputSchema = {
  ids: z.array(z.string()).describe("Array of IDs of the created records"),
  revisions: z
    .array(z.string())
    .describe("Array of revision numbers of the created records"),
};

export const addRecords = createTool(
  "kintone-add-records",
  {
    description:
      "Add multiple records to a kintone app. Use kintone-get-form-fields tool first to discover available field codes and their required formats. Note: Some fields cannot be registered (LOOKUP copies, STATUS, CATEGORY, CALC, ASSIGNEE, auto-calculated fields).",
    inputSchema,
    outputSchema,
  },
  async ({ app, records }) => {
    const config = parseKintoneClientConfig();
    const client = getKintoneClient(config);

    const response = await client.record.addRecords({
      app,
      records,
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
  },
);
