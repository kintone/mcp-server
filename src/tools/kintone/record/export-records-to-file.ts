import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { createTool } from "../../factory.js";
import { ensureDirectoryExists } from "../../../lib/filesystem.js";
import {
  filtersSchema,
  orderBySchema,
  buildQueryFromFilters,
} from "./get-records.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const LARGE_FETCH_THRESHOLD = 500;

const inputSchema = {
  app: z.string().describe('App ID (numeric string). e.g. "123"'),
  filters: filtersSchema,
  fields: z
    .array(z.string())
    .optional()
    .describe(
      'Field codes to retrieve. Omit for all fields. The record id ("$id") is always retrieved on top of the selection.',
    ),
  orderBy: orderBySchema,
  limit: z
    .number()
    .min(1)
    .max(500)
    .optional()
    .describe(
      "Records per call (1–500). Omit to fetch all via auto-pagination.",
    ),
  offset: z
    .number()
    .min(0)
    .optional()
    .describe(
      "Records to skip. Only effective when `limit` is specified. " +
        "Ignored in full-export mode (limit omitted) since getAllRecords does not support offset.",
    ),
  confirmLargeFetch: z
    .boolean()
    .optional()
    .describe(
      `Confirmation flag for full-export mode. When totalCount exceeds ${LARGE_FETCH_THRESHOLD}, ` +
        "the tool refuses to proceed unless this is set to true. " +
        "Confirm with the user before re-invoking with this flag.",
    ),
};

const outputSchema = {
  filePath: z
    .string()
    .describe("Absolute path to the saved JSON file containing records"),
  app: z.string().describe("The app ID that records were exported from"),
  totalCount: z
    .string()
    .describe("Total count of records matching the query on the kintone side"),
  savedCount: z
    .number()
    .describe("Number of records actually written to the output file"),
  fileSize: z.number().describe("Size of the saved file in bytes"),
};

const RECORD_ID_FIELD_CODE = "$id";

/**
 * kintone returns only the requested field codes, and a file without the record
 * id cannot be fed back to kintone-update-records-from-file, so the record id is
 * retrieved along with any selection.
 */
const withRecordId = (fields: string[] | undefined): string[] | undefined =>
  fields === undefined || fields.includes(RECORD_ID_FIELD_CODE)
    ? fields
    : [...fields, RECORD_ID_FIELD_CODE];

const formatTimestamp = (d: Date): string => {
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}` +
    `-${pad(d.getMilliseconds(), 3)}`
  );
};

type ConditionAndOrderBy = {
  condition: string | undefined;
  orderByClause: string | undefined;
};

const buildConditionAndOrderBy = (
  filters: z.infer<typeof filtersSchema>,
  orderBy: z.infer<typeof orderBySchema>,
): ConditionAndOrderBy => {
  const condition = filters ? buildQueryFromFilters(filters) : undefined;
  const orderByClause =
    orderBy && orderBy.length > 0
      ? orderBy.map((o) => `${o.field} ${o.order ?? "asc"}`).join(", ")
      : undefined;
  return { condition, orderByClause };
};

const composeQueryString = (
  condition: string | undefined,
  orderByClause: string | undefined,
  suffix: string | undefined,
): string => {
  const parts: string[] = [];
  if (condition) parts.push(condition);
  if (orderByClause) parts.push(`order by ${orderByClause}`);
  if (suffix) parts.push(suffix);
  return parts.join(" ");
};

const writeRecordsFile = (
  attachmentsDir: string,
  app: string,
  records: unknown[],
  totalCount: string,
): { filePath: string; fileSize: number } => {
  ensureDirectoryExists(attachmentsDir);

  const fileName = `kintone-records_app-${app}_${formatTimestamp(new Date())}.json`;
  const filePath = path.join(attachmentsDir, fileName);
  const fileContent = JSON.stringify({ records, totalCount }, null, 2);
  fs.writeFileSync(filePath, fileContent, "utf-8");
  const fileSize = Buffer.byteLength(fileContent, "utf-8");

  return { filePath, fileSize };
};

const toolName = "kintone-export-records-to-file";
const toolConfig = {
  title: "Export Records to File",
  description:
    "Export kintone app records to a local JSON file under KINTONE_ATTACHMENTS_DIR, WITHOUT returning the record contents to the LLM. " +
    "Use this for numerical/date analysis, scripting, or datasets larger than about 50 records, so record contents are not loaded into the conversation. " +
    "Omitting `limit` fetches all matching records via getAllRecords; for safety, when the matched total exceeds " +
    `${LARGE_FETCH_THRESHOLD} records the tool stops and requires \`confirmLargeFetch=true\` to proceed. ` +
    'The file holds { "records": [...] } in the retrieval format ({ "type": ..., "value": ... }), including the record id in "$id", so it can be edited and fed back to kintone-update-records-from-file or kintone-import-records-from-file. ' +
    "totalCount reflects the record count matched on the kintone side, while savedCount is the number of records actually written to the file.",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { app, filters, fields, orderBy, limit, offset, confirmLargeFetch },
  { client, attachmentsDir },
) => {
  if (!attachmentsDir) {
    throw new Error(
      "KINTONE_ATTACHMENTS_DIR environment variable must be set to use kintone-export-records-to-file",
    );
  }

  const { condition, orderByClause } = buildConditionAndOrderBy(
    filters,
    orderBy,
  );
  const fieldsToRetrieve = withRecordId(fields);

  let records: unknown[];
  let totalCount: string;

  if (limit !== undefined) {
    const limitClause =
      offset !== undefined
        ? `limit ${limit} offset ${offset}`
        : `limit ${limit}`;
    const query = composeQueryString(condition, orderByClause, limitClause);

    const response = await client.record.getRecords({
      app,
      query,
      fields: fieldsToRetrieve,
      totalCount: true,
    });
    records = response.records;
    totalCount = response.totalCount ?? String(response.records.length);
  } else {
    // Full-export mode: probe totalCount first with a minimal request, then
    // gate on confirmLargeFetch before calling getAllRecords.
    const probeQuery = composeQueryString(condition, orderByClause, "limit 1");
    const probe = await client.record.getRecords({
      app,
      query: probeQuery,
      fields: [RECORD_ID_FIELD_CODE],
      totalCount: true,
    });
    totalCount = probe.totalCount ?? "0";
    const totalCountNum = Number(totalCount);

    if (
      Number.isFinite(totalCountNum) &&
      totalCountNum > LARGE_FETCH_THRESHOLD &&
      confirmLargeFetch !== true
    ) {
      throw new Error(
        `Total matching records (${totalCount}) exceeds the safety threshold of ${LARGE_FETCH_THRESHOLD}. ` +
          "Confirm with the user before fetching this many records, then re-invoke this tool with " +
          "`confirmLargeFetch: true`. No records were fetched or written.",
      );
    }

    records = await client.record.getAllRecords({
      app,
      condition,
      orderBy: orderByClause,
      fields: fieldsToRetrieve,
    });
  }

  const { filePath, fileSize } = writeRecordsFile(
    attachmentsDir,
    app,
    records,
    totalCount,
  );

  const result = {
    filePath,
    app,
    totalCount,
    savedCount: records.length,
    fileSize,
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

export const exportRecordsToFile = createTool(toolName, toolConfig, callback);
