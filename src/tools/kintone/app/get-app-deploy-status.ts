import { z } from "zod";
import { createTool } from "../../factory.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const inputSchema = {
  apps: z
    .array(z.union([z.string(), z.number()]))
    .min(1, "At least one app ID is required")
    .max(300, "Maximum 300 app IDs allowed")
    .describe("Array of app IDs to check deploy status (maximum 300)"),
};

const deployStatusEnum = z.enum(["PROCESSING", "SUCCESS", "FAIL", "CANCEL"], {
  description:
    "Deployment status: PROCESSING (in progress), SUCCESS (completed), FAIL (failed), CANCEL (canceled)",
});

const outputSchema = {
  apps: z
    .array(
      z.object({
        app: z.string().describe("The app ID"),
        status: deployStatusEnum.describe("The deployment status"),
      }),
    )
    .describe("Array of app deploy statuses"),
};

const toolName = "kintone-get-app-deploy-status";
const toolConfig = {
  title: "Get App Deploy Status",
  description: "Get app deploy status from kintone",
  inputSchema,
  outputSchema,
};
const callback: KintoneToolCallback<typeof inputSchema> = async (
  { apps },
  { client },
) => {
  const result = await client.app.getDeployStatus({
    apps,
  });

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

export const getAppDeployStatus = createTool(toolName, toolConfig, callback);
