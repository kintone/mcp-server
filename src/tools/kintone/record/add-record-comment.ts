import { z } from "zod";
import { createTool } from "../../factory.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const mentionSchema = z.object({
  code: z
    .string()
    .describe(
      "Login name (for USER), group/role code (for GROUP), or organization code (for ORGANIZATION). Display names are not accepted.",
    ),
  type: z
    .enum(["USER", "GROUP", "ORGANIZATION"])
    .describe("Type of the mention target"),
});

const inputSchema = {
  app: z
    .string()
    .describe(
      "The ID of the app that contains the record (numeric value as string)",
    ),
  record: z.string().describe("The ID of the record to add a comment to"),
  text: z
    .string()
    .min(1)
    .describe(
      "Comment text. To mention users/groups/organizations, include '@code' tokens here and list the corresponding entries in 'mentions'.",
    ),
  mentions: z
    .array(mentionSchema)
    .optional()
    .describe(
      "Mentions to attach to the comment. Each entry pairs a code with its type (USER/GROUP/ORGANIZATION).",
    ),
};

const outputSchema = {
  id: z.string().describe("ID of the added comment"),
};

const toolName = "kintone-add-record-comment";
const toolConfig = {
  title: "Add Record Comment",
  description:
    "Add a single comment to a kintone record. The kintone API accepts one comment per call; to add comments to multiple records, call this tool repeatedly.",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { app, record, text, mentions },
  { client },
) => {
  const response = await client.record.addRecordComment({
    app,
    record,
    comment: {
      text,
      mentions,
    },
  });

  const result = {
    id: response.id,
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

export const addRecordComment = createTool(toolName, toolConfig, callback);
