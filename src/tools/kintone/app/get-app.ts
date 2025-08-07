import { z } from "zod";
import { createTool } from "../../utils.js";
import { getKintoneClient } from "../../../client.js";
import { parseKintoneClientConfig } from "../../../config.js";

const inputSchema = {
  appId: z.number().describe("The ID of the app to retrieve"),
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

export const getApp = createTool(
  "kintone-get-app",
  {
    description: "Get app settings from kintone",
    inputSchema,
    outputSchema,
  },
  async ({ appId }) => {
    const config = parseKintoneClientConfig();
    const client = getKintoneClient(config);
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
  },
);
