import { createTool } from "../../factory.js";
import {
  searchInputSchema,
  searchOutputSchema,
} from "../../../schema/search/index.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const toolName = "kintone-search";
const toolConfig = {
  title: "Search",
  description:
    "Search across kintone for records, spaces, threads, comments, and attachments. " +
    "Performs a cross-domain full-text search. " +
    "Requires password or session authentication (not API token).",
  inputSchema: searchInputSchema,
  outputSchema: searchOutputSchema,
};

const callback: KintoneToolCallback<typeof searchInputSchema> = async (
  input,
  { client },
) => {
  const { query, ...rest } = input;
  const response = await client.search({
    ...rest,
    query: query as [
      { operator: "AND" | "NOT"; keywords: string[] },
      ...Array<{ operator: "AND" | "NOT"; keywords: string[] }>,
    ],
  });

  const result = {
    hits: response.hits,
    nextPageToken: response.nextPageToken,
  };

  return {
    structuredContent: result,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
};

export const search = createTool(toolName, toolConfig, callback);
