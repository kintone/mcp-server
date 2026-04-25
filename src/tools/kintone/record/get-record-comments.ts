import { z } from "zod";
import { createTool } from "../../factory.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const inputSchema = {
  app: z
    .string()
    .describe(
      "The ID of the app that contains the record (numeric value as string)",
    ),
  record: z.string().describe("The ID of the record to retrieve comments from"),
  order: z
    .enum(["asc", "desc"])
    .optional()
    .describe(
      "Sort order of comments by createdAt. 'asc' = oldest first, 'desc' = newest first (default: desc)",
    ),
  limit: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .describe(
      "Maximum number of comments to retrieve (1-10, default: 10 by kintone API)",
    ),
  offset: z
    .number()
    .min(0)
    .optional()
    .describe("Number of comments to skip (default: 0)"),
};

const commentSchema = z.object({
  id: z.string().describe("Comment ID"),
  text: z.string().describe("Comment text"),
  createdAt: z.string().describe("Comment creation datetime (ISO 8601)"),
  creator: z
    .object({
      code: z.string().describe("User code of the comment creator"),
      name: z.string().describe("Display name of the comment creator"),
    })
    .describe("Information about the comment creator"),
  mentions: z
    .array(
      z.object({
        code: z.string().describe("Code of the mentioned user/group/org"),
        type: z
          .enum(["USER", "GROUP", "ORGANIZATION"])
          .describe("Type of the mention target"),
      }),
    )
    .describe("Mentions in the comment"),
});

const outputSchema = {
  comments: z.array(commentSchema).describe("Array of comments on the record"),
  older: z
    .boolean()
    .describe("Whether there are older comments beyond this page"),
  newer: z
    .boolean()
    .describe("Whether there are newer comments beyond this page"),
};

const toolName = "kintone-get-record-comments";
const toolConfig = {
  title: "Get Record Comments",
  description:
    "Get comments posted on a single kintone record. The kintone API returns comments for one record at a time; to fetch comments for multiple records, call this tool repeatedly. Up to 10 comments are returned per call; use offset to paginate.",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { app, record, order, limit, offset },
  { client },
) => {
  const response = await client.record.getRecordComments({
    app,
    record,
    order,
    limit,
    offset,
  });

  const result = {
    comments: response.comments,
    older: response.older,
    newer: response.newer,
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

export const getRecordComments = createTool(toolName, toolConfig, callback);
