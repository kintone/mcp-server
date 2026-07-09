import { z } from "zod";
import { createTool } from "../../factory.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const inputSchema = {
  id: z
    .string()
    .describe(
      "Space ID as returned by Kintone (numeric string). Same value as in space URLs and other Space APIs.",
    ),
};

const outputSchema = {};

const toolName = "kintone-delete-space";
const toolConfig = {
  title: "Delete Space",
  description:
    "Delete a kintone space via the Space REST API (DELETE /k/v1/space.json). " +
    "Destructive and irreversible: permanently removes the target space along with all of its threads, comments, and the apps and records that belong to the space. " +
    "Requires space administrator privileges on the target space. " +
    "The deletion is applied immediately to the production environment (no deploy step) and cannot be undone from this tool. " +
    "The API returns an empty body on success.",
  inputSchema,
  outputSchema,
};
const callback: KintoneToolCallback<typeof inputSchema> = async (
  { id },
  { client },
) => {
  await client.space.deleteSpace({ id });

  return {
    structuredContent: {},
    content: [],
  };
};

export const deleteSpace = createTool(toolName, toolConfig, callback);
