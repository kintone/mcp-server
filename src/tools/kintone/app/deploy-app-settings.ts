import { z } from "zod";
import { createTool } from "../../factory.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const inputSchema = {
  apps: z
    .array(
      z.object({
        app: z
          .string()
          .describe("The ID of the app to deploy (numeric value as string)"),
        revision: z
          .string()
          .optional()
          .describe("The expected revision number"),
      }),
    )
    .min(1)
    .max(300)
    .describe("List of apps to deploy (minimum 1, maximum 300 apps)"),
  revert: z
    .boolean()
    .optional()
    .describe("If true, revert changes instead of deploying (default: false)"),
};

const outputSchema = {};

const toolName = "kintone-deploy-app-settings";
const toolConfig = {
  title: "Deploy App Settings",
  description:
    "Deploy app settings from pre-live to production environment on kintone",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { apps, revert },
  { client },
) => {
  await client.app.deployApp({ apps, revert });

  const result = {};

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

export const deployAppSettings = createTool(toolName, toolConfig, callback);
