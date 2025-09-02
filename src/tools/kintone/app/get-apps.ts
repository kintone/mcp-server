import { z } from "zod";
import type { KintoneToolCallback } from "../../schema.js";
import { createTool } from "../../factory.js";

const inputSchema = {
  ids: z
    .array(z.string())
    .max(100)
    .optional()
    .describe("Array of app IDs (numeric values as strings, max 100)"),
  codes: z
    .array(z.string().max(64))
    .max(100)
    .optional()
    .describe("Array of app codes (max 64 characters each)"),
  name: z
    .string()
    .max(64)
    .optional()
    .describe("App name for partial match search"),
  spaceIds: z
    .array(z.string())
    .max(100)
    .optional()
    .describe("Array of space IDs (numeric values as strings, max 100)"),
  offset: z
    .number()
    .min(0)
    .optional()
    .default(0)
    .describe("Offset for pagination (default: 0)"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .default(100)
    .describe("Number of apps to retrieve (1-100, default: 100)"),
};

const appSchema = z.object({
  appId: z.string().describe("The app ID"),
  code: z.string().describe("The app code (empty string if not set)"),
  name: z.string().describe("The app name"),
  description: z
    .string()
    .describe("The app description (empty string if not set)"),
  spaceId: z
    .string()
    .nullable()
    .describe("The space ID (null if not in a space)"),
  threadId: z
    .string()
    .nullable()
    .describe("The thread ID (null if not in a space)"),
  createdAt: z.string().describe("The creation date and time"),
  creator: z
    .object({
      code: z.string().describe("The creator's user code"),
      name: z.string().describe("The creator's display name"),
    })
    .describe("The creator information"),
  modifiedAt: z.string().describe("The last modified date and time"),
  modifier: z
    .object({
      code: z.string().describe("The modifier's user code"),
      name: z.string().describe("The modifier's display name"),
    })
    .describe("The modifier information"),
});

const outputSchema = {
  apps: z.array(appSchema).describe("Array of app information"),
};

const toolName = "kintone-get-apps";
const toolConfig = {
  title: "Get Apps",
  description: "Get multiple app settings from kintone",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { ids, codes, name, spaceIds, offset, limit },
  { client },
) => {
  const response = await client.app.getApps({
    ids,
    codes,
    name,
    spaceIds,
    offset,
    limit,
  });

  const result = {
    apps: response.apps.map((app) => ({
      appId: app.appId,
      code: app.code,
      name: app.name,
      description: app.description,
      spaceId: app.spaceId,
      threadId: app.threadId,
      createdAt: app.createdAt,
      creator: app.creator,
      modifiedAt: app.modifiedAt,
      modifier: app.modifier,
    })),
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

export const getApps = createTool(toolName, toolConfig, callback);
