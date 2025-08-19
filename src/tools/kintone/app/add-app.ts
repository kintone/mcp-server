import { z } from "zod";
import { createTool } from "../../utils.js";
import { getKintoneClient } from "../../../client.js";
import { parseKintoneClientConfig } from "../../../config.js";

const inputSchema = {
  name: z
    .string()
    .max(64)
    .describe("The name of the app to create (max 64 characters)"),
  space: z
    .number()
    .optional()
    .describe("The space ID where the app will be created (optional)"),
  thread: z
    .number()
    .optional()
    .describe("The thread ID where the app will be created (optional)"),
};

const outputSchema = {
  app: z.string().describe("The ID of the created app"),
  revision: z.string().describe("The revision number of the created app"),
};

export const addApp = createTool(
  "kintone-add-app",
  {
    description: "Create a new app in kintone",
    inputSchema,
    outputSchema,
  },
  async ({ name, space, thread }) => {
    const config = parseKintoneClientConfig();
    const client = getKintoneClient(config);

    const params: { name: string; space?: number; thread?: number } = { name };
    if (space !== undefined) params.space = space;
    if (thread !== undefined) params.thread = thread;

    const result = await client.app.addApp(params);

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
