import { z } from "zod";
import { createTool } from "../../types.js";
import { getKintoneClient } from "../../../client.js";
import { parseKintoneClientConfig } from "../../../config.js";
import { recordSchema } from "../../../schema/record/records.js";

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
    .union([z.number(), z.string()])
    .describe("The ID of the app to retrieve records from"),
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
  },
);
