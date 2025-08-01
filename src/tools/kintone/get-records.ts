import { z } from "zod";
import { createTool } from "../types.js";
import { getKintoneClient } from "../../client.js";
import { parseKintoneClientConfig } from "../../config.js";

const inputSchema = {
  app: z
    .union([z.number(), z.string()])
    .describe("The ID of the app to retrieve records from"),
  filters: z
    .object({
      textContains: z
        .array(
          z.object({
            field: z.string().describe("Field code"),
            value: z.string().describe("Text to search for"),
          }),
        )
        .optional()
        .describe("Text fields containing specified values"),
      equals: z
        .array(
          z.object({
            field: z.string().describe("Field code"),
            value: z
              .union([z.string(), z.number()])
              .describe("Exact value to match"),
          }),
        )
        .optional()
        .describe("Fields equal to specified values"),
      dateRange: z
        .array(
          z.object({
            field: z.string().describe("Field code"),
            from: z.string().optional().describe("Start date (YYYY-MM-DD)"),
            to: z.string().optional().describe("End date (YYYY-MM-DD)"),
          }),
        )
        .optional()
        .describe("Date fields within specified range"),
      numberRange: z
        .array(
          z.object({
            field: z.string().describe("Field code"),
            min: z.number().optional().describe("Minimum value"),
            max: z.number().optional().describe("Maximum value"),
          }),
        )
        .optional()
        .describe("Number fields within specified range"),
      inValues: z
        .array(
          z.object({
            field: z.string().describe("Field code"),
            values: z.array(z.string()).describe("List of values to match"),
          }),
        )
        .optional()
        .describe("Fields matching any of the specified values"),
      notInValues: z
        .array(
          z.object({
            field: z.string().describe("Field code"),
            values: z.array(z.string()).describe("List of values to exclude"),
          }),
        )
        .optional()
        .describe("Fields not matching any of the specified values"),
    })
    .optional()
    .describe(
      "Filter conditions for records. Use kintone-get-form-fields tool to discover available field codes and types for an app",
    ),
  fields: z
    .array(z.string())
    .optional()
    .describe(
      "Array of field codes to retrieve. If not specified, all fields are retrieved. Use kintone-get-form-fields tool to see available fields",
    ),
  orderBy: z
    .array(
      z.object({
        field: z.string().describe("Field code to sort by"),
        order: z
          .enum(["asc", "desc"])
          .optional()
          .describe("Sort order (default: asc)"),
      }),
    )
    .optional()
    .describe("Sort order for results"),
  limit: z
    .number()
    .min(1)
    .max(500)
    .optional()
    .describe("Maximum number of records to retrieve (1-500)"),
  offset: z.number().min(0).optional().describe("Number of records to skip"),
};

const recordValueSchema = z.union([
  z.object({
    type: z.literal("SINGLE_LINE_TEXT"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("MULTI_LINE_TEXT"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("RICH_TEXT"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("NUMBER"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("DATE"),
    value: z.string().nullable(),
  }),
  z.object({
    type: z.literal("DATETIME"),
    value: z.string().nullable(),
  }),
  z.object({
    type: z.literal("DROP_DOWN"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("CHECK_BOX"),
    value: z.array(z.string()),
  }),
  z.object({
    type: z.literal("MULTI_SELECT"),
    value: z.array(z.string()),
  }),
  z.object({
    type: z.literal("RADIO_BUTTON"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("USER_SELECT"),
    value: z.array(
      z.object({
        code: z.string(), // 通常ユーザー: "sato", ゲストユーザー: "guest/sato@example.com"
        name: z.string(),
      }),
    ),
  }),
  z.object({
    type: z.literal("CREATOR"),
    value: z.object({
      code: z.string(), // 通常ユーザー: "sato", ゲストユーザー: "guest/sato@example.com"
      name: z.string(),
    }),
  }),
  z.object({
    type: z.literal("CREATED_TIME"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("MODIFIER"),
    value: z.object({
      code: z.string(), // 通常ユーザー: "sato", ゲストユーザー: "guest/sato@example.com"
      name: z.string(),
    }),
  }),
  z.object({
    type: z.literal("UPDATED_TIME"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("RECORD_NUMBER"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("__ID__"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("__REVISION__"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("CATEGORY"),
    value: z.array(z.string()),
  }),
  z.object({
    type: z.literal("STATUS"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("STATUS_ASSIGNEE"),
    value: z.array(
      z.object({
        code: z.string(), // 通常ユーザー: "sato", ゲストユーザー: "guest/sato@example.com"
        name: z.string(),
      }),
    ),
  }),
  z.object({
    type: z.literal("FILE"),
    value: z.array(
      z.object({
        contentType: z.string(),
        fileKey: z.string(),
        name: z.string(),
        size: z.string(),
      }),
    ),
  }),
  z.object({
    type: z.literal("LINK"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("CALC"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("LOOKUP"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("TIME"),
    value: z.string().nullable(),
  }),
  z.object({
    type: z.literal("SUBTABLE"),
    value: z.array(
      z.object({
        id: z.string(),
        value: z.record(z.any()),
      }),
    ),
  }),
  z.object({
    type: z.literal("GROUP"),
    value: z.array(z.any()),
  }),
  z.object({
    type: z.literal("REFERENCE_TABLE"),
    value: z.null(), // 公式ドキュメント: 値の取得はできません
  }),
  z.object({
    type: z.literal("ORGANIZATION_SELECT"),
    value: z.array(
      z.object({
        code: z.string(),
        name: z.string(),
      }),
    ),
  }),
  z.object({
    type: z.literal("GROUP_SELECT"),
    value: z.array(
      z.object({
        code: z.string(),
        name: z.string(),
      }),
    ),
  }),
  z.object({
    type: z.literal("SPACER"),
    value: z.null(),
  }),
  z.object({
    type: z.literal("HR"),
    value: z.null(),
  }),
  z.object({
    type: z.literal("LABEL"),
    value: z.null(),
  }),
  // 追加の可能性があるフィールドタイプ
  z.object({
    type: z.literal("MOBILE"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("EMAIL"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("URL"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("PASSWORD"),
    value: z.string(),
  }),
]);

const recordSchema = z.record(recordValueSchema);

const outputSchema = {
  records: z
    .array(recordSchema)
    .describe("Array of records matching the query"),
  totalCount: z
    .string()
    .optional()
    .describe("Total count of records matching the query (if requested)"),
};

function buildQueryFromFilters(filters: any): string | undefined {
  const conditions: string[] = [];

  // textContains
  filters.textContains?.forEach((f: any) => {
    conditions.push(`${f.field} like "${f.value}"`);
  });

  // equals
  filters.equals?.forEach((f: any) => {
    if (typeof f.value === "string") {
      conditions.push(`${f.field} = "${f.value}"`);
    } else {
      conditions.push(`${f.field} = ${f.value}`);
    }
  });

  // dateRange
  filters.dateRange?.forEach((f: any) => {
    if (f.from) conditions.push(`${f.field} >= "${f.from}"`);
    if (f.to) conditions.push(`${f.field} <= "${f.to}"`);
  });

  // numberRange
  filters.numberRange?.forEach((f: any) => {
    if (f.min !== undefined) conditions.push(`${f.field} >= ${f.min}`);
    if (f.max !== undefined) conditions.push(`${f.field} <= ${f.max}`);
  });

  // inValues
  filters.inValues?.forEach((f: any) => {
    const values = f.values.map((v: string) => `"${v}"`).join(", ");
    conditions.push(`${f.field} in (${values})`);
  });

  // notInValues
  filters.notInValues?.forEach((f: any) => {
    const values = f.values.map((v: string) => `"${v}"`).join(", ");
    conditions.push(`${f.field} not in (${values})`);
  });

  return conditions.length > 0 ? conditions.join(" and ") : undefined;
}

export const getRecords = createTool(
  "kintone-get-records",
  {
    description:
      "Get multiple records from a kintone app with structured filtering. Use kintone-get-form-fields tool first to discover available fields and their types.",
    inputSchema,
    outputSchema,
  },
  async ({ app, filters, fields, orderBy, limit, offset }) => {
    const config = parseKintoneClientConfig();
    const client = getKintoneClient(config);

    // Build query from filters
    let query = filters ? buildQueryFromFilters(filters) : undefined;

    // Add orderBy if specified
    if (orderBy && orderBy.length > 0) {
      const orderClauses = orderBy
        .map((o) => `${o.field} ${o.order || "asc"}`)
        .join(", ");
      query = query
        ? `${query} order by ${orderClauses}`
        : `order by ${orderClauses}`;
    }

    // Add limit if specified
    if (limit !== undefined) {
      query = query ? `${query} limit ${limit}` : `limit ${limit}`;
    }

    // Add offset if specified
    if (offset !== undefined) {
      query = query ? `${query} offset ${offset}` : `offset ${offset}`;
    }

    const response = await client.record.getRecords({
      app,
      query,
      fields,
      totalCount: true,
    });

    const result = {
      records: response.records,
      ...(response.totalCount !== undefined && {
        totalCount: response.totalCount,
      }),
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
