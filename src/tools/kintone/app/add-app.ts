import { z } from "zod";
import { createTool } from "../../factory.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const inputSchema = {
  name: z
    .string()
    .max(64)
    .describe("The name of the app to create (max 64 characters)"),
  space: z
    .number()
    .optional()
    .describe("The space ID where the app will be created"),
};

const outputSchema = {
  app: z.string().describe("The ID of the created app"),
  revision: z.string().describe("The revision number of the created app"),
};

const toolName = "kintone-add-app";
const toolConfig = {
  title: "Add App",
  description: "Create a new app in the pre-live environment on kintone",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { name, space },
  { client },
) => {
  const app = await client.app.addApp({ name, space });

  const result = {
    app: app.app,
    revision: app.revision,
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

export const addApp = createTool(toolName, toolConfig, callback);
