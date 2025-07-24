import { z } from "zod";
import { createTool } from "../types.js";
import { getKintoneClient } from "../../client.js";
import { parseKintoneClientConfig } from "../../config.js";

const inputSchema = {
  ids: z.array(z.number()).optional().describe("Array of app IDs (max 100)"),
  codes: z
    .array(z.string().max(64))
    .optional()
    .describe("Array of app codes (max 64 characters each)"),
  name: z
    .string()
    .max(64)
    .optional()
    .describe("App name for partial match search"),
  spaceIds: z
    .array(z.number())
    .optional()
    .describe("Array of space IDs (max 100)"),
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

export const getApps = createTool(
  "kintone-get-apps",
  {
    description: "Get multiple app settings from kintone",
    inputSchema,
    outputSchema,
  },
  async ({ ids, codes, name, spaceIds, offset, limit }) => {
    const config = parseKintoneClientConfig();
    const client = getKintoneClient(config);

    const params: {
      ids?: number[];
      codes?: string[];
      name?: string;
      spaceIds?: number[];
      offset?: number;
      limit?: number;
    } = {};

    if (ids !== undefined) params.ids = ids;
    if (codes !== undefined) params.codes = codes;
    if (name !== undefined) params.name = name;
    if (spaceIds !== undefined) params.spaceIds = spaceIds;
    if (offset !== undefined) params.offset = offset;
    if (limit !== undefined) params.limit = limit;

    const response = await client.app.getApps(params);

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
  },
);
