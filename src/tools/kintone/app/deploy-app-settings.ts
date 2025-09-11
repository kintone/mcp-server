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
    .max(300)
    .describe("List of apps to deploy (maximum 300 apps)"),
  revert: z
    .boolean()
    .optional()
    .describe("If true, revert changes instead of deploying (default: false)"),
};

const outputSchema = {
  success: z.boolean().describe("Whether the deployment was successful"),
};

const toolName = "kintone-deploy-app-settings";
const toolConfig = {
  title: "Deploy App Settings",
  description:
    "Deploy app settings from development to production environment on kintone",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { apps, revert },
  { client },
) => {
  const params: {
    apps: Array<{ app: string; revision?: string }>;
    revert?: boolean;
  } = { apps };
  if (revert !== undefined) params.revert = revert;

  await client.app.deployApp(params);
  const result = {
    success: true,
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

export const deployAppSettings = createTool(toolName, toolConfig, callback);
