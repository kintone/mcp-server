import { z } from "zod";
import { createTool } from "../../factory.js";
import { recordSchema } from "../../../schema/record/index.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const filtersSchema = z
  .object({
    textContains: z
      .array(
        z.object({
          field: z.string().describe("Field code"),
          value: z.string().describe("Text to search for"),
        }),
      )
      .optional()
      .describe(
        "Text fields containing specified values (like operator). " +
          "Supported fields: SINGLE_LINE_TEXT, LINK, MULTI_LINE_TEXT, RICH_TEXT, ATTACHMENT",
      ),
    equals: z
      .array(
        z.object({
          field: z.string().describe("Field code"),
          value: z.string().describe("Exact value to match"),
        }),
      )
      .optional()
      .describe(
        "Fields equal to specified values (= operator). " +
          "Supported fields: RECORD_NUMBER, SINGLE_LINE_TEXT, LINK, NUMBER, CALC, DATE, TIME, DATETIME, CREATED_TIME, UPDATED_TIME, STATUS",
      ),
    dateRange: z
      .array(
        z.object({
          field: z.string().describe("Field code"),
          from: z.string().optional().describe("Start date (YYYY-MM-DD)"),
          to: z.string().optional().describe("End date (YYYY-MM-DD)"),
        }),
      )
      .optional()
      .describe(
        "Date fields within specified range (>=, <= operators). " +
          "Supported fields: DATE, TIME, DATETIME, CREATED_TIME, UPDATED_TIME",
      ),
    numberRange: z
      .array(
        z.object({
          field: z.string().describe("Field code"),
          min: z.number().optional().describe("Minimum value"),
          max: z.number().optional().describe("Maximum value"),
        }),
      )
      .optional()
      .describe(
        "Number fields within specified range (>=, <= operators). " +
          "Supported fields: RECORD_NUMBER, $id, NUMBER, CALC",
      ),
    inValues: z
      .array(
        z.object({
          field: z.string().describe("Field code"),
          values: z.array(z.string()).describe("List of values to match"),
        }),
      )
      .optional()
      .describe(
        "Fields matching any of the specified values (in operator). " +
          "Supported fields: RECORD_NUMBER, $id, SINGLE_LINE_TEXT, LINK, NUMBER, CALC, CHECK_BOX, RADIO_BUTTON, DROP_DOWN, MULTI_SELECT, USER_SELECT, ORGANIZATION_SELECT, GROUP_SELECT, STATUS, CREATOR, MODIFIER",
      ),
    notInValues: z
      .array(
        z.object({
          field: z.string().describe("Field code"),
          values: z.array(z.string()).describe("List of values to exclude"),
        }),
      )
      .optional()
      .describe(
        "Fields not matching any of the specified values (not in operator). " +
          "Supported fields: RECORD_NUMBER, $id, SINGLE_LINE_TEXT, LINK, NUMBER, CALC, CHECK_BOX, RADIO_BUTTON, DROP_DOWN, MULTI_SELECT, USER_SELECT, ORGANIZATION_SELECT, GROUP_SELECT, STATUS, CREATOR, MODIFIER",
      ),
  })
  .optional()
  .describe(
    "Filter conditions for records. Use kintone-get-form-fields tool to discover available field codes and types for an app",
  );

const orderBySchema = z
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
  .describe("Sort order for results");

const inputSchema = {
  app: z
    .string()
    .describe(
      "The ID of the app to retrieve records from (numeric value as string)",
    ),
  filters: filtersSchema,
  fields: z
    .array(z.string())
    .optional()
    .describe(
      "Array of field codes to retrieve. If not specified, all fields are retrieved. Use kintone-get-form-fields tool to see available fields",
    ),
  orderBy: orderBySchema,
  limit: z
    .number()
    .min(1)
    .max(500)
    .optional()
    .describe("Maximum number of records to retrieve (1-500)"),
  offset: z.number().min(0).optional().describe("Number of records to skip"),
};

const outputSchema = {
  records: z
    .array(recordSchema)
    .describe("Array of records matching the query"),
  totalCount: z.string().describe("Total count of records matching the query"),
};

function buildQueryFromFilters(
  filters: NonNullable<z.infer<typeof filtersSchema>>,
): string | undefined {
  const conditions: string[] = [];

  filters.textContains?.forEach((f: any) => {
    conditions.push(`${f.field} like "${f.value}"`);
  });

  filters.equals?.forEach((f: any) => {
    if (typeof f.value === "string") {
      conditions.push(`${f.field} = "${f.value}"`);
    } else {
      conditions.push(`${f.field} = ${f.value}`);
    }
  });

  filters.dateRange?.forEach((f: any) => {
    if (f.from) conditions.push(`${f.field} >= "${f.from}"`);
    if (f.to) conditions.push(`${f.field} <= "${f.to}"`);
  });

  filters.numberRange?.forEach((f: any) => {
    if (f.min !== undefined) conditions.push(`${f.field} >= ${f.min}`);
    if (f.max !== undefined) conditions.push(`${f.field} <= ${f.max}`);
  });

  filters.inValues?.forEach((f: any) => {
    const values = f.values.map((v: string) => `"${v}"`).join(", ");
    conditions.push(`${f.field} in (${values})`);
  });

  filters.notInValues?.forEach((f: any) => {
    const values = f.values.map((v: string) => `"${v}"`).join(", ");
    conditions.push(`${f.field} not in (${values})`);
  });

  return conditions.length > 0 ? conditions.join(" and ") : undefined;
}

const toolName = "kintone-get-records";
const toolConfig = {
  title: "Get Records",
  description:
    "Get multiple records from a kintone app with structured filtering. Use kintone-get-form-fields tool first to discover available fields and their types.",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { app, filters, fields, orderBy, limit, offset },
  { client },
) => {
  let query = filters ? buildQueryFromFilters(filters) : undefined;

  if (orderBy && orderBy.length > 0) {
    const orderClauses = orderBy
      .map((o) => `${o.field} ${o.order || "asc"}`)
      .join(", ");
    query = query
      ? `${query} order by ${orderClauses}`
      : `order by ${orderClauses}`;
  }

  if (limit !== undefined) {
    query = query ? `${query} limit ${limit}` : `limit ${limit}`;
  }

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
    totalCount: response.totalCount,
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

export const getRecords = createTool(toolName, toolConfig, callback);
