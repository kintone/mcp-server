import { z } from "zod";
import type { KintoneToolCallback } from "../../schema.js";
import { createTool } from "../../factory.js";

const inputSchema = {
  appId: z
    .string()
    .describe("The ID of the app to retrieve (numeric value as string)"),
};

const outputSchema = {
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
};

const toolName = "kintone-get-app";
const toolConfig = {
  title: "Get App",
  description: "Get app settings from kintone",
  inputSchema,
  outputSchema,
};
const callback: KintoneToolCallback<typeof inputSchema> = async (
  { appId },
  { client },
) => {
  const app = await client.app.getApp({ id: appId });
  const result = {
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

export const getApp = createTool(toolName, toolConfig, callback);
