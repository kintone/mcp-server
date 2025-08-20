import { z } from "zod";
import { createTool } from "../../utils.js";
import { getKintoneClient } from "../../../client.js";
import { parseKintoneClientConfig } from "../../../config.js";

const inputSchema = {
  apps: z
    .array(
      z.object({
        app: z.union([z.number(), z.string()]).describe("The app ID"),
        revision: z
          .string()
          .optional()
          .describe("App revision number for optimistic locking"),
      }),
    )
    .describe("Array of apps to deploy"),
  revert: z
    .boolean()
    .optional()
    .describe("Whether to revert to the latest published revision"),
};

const outputSchema = {};

export const deployApp = createTool(
  "kintone-deploy-app",
  {
    description: "Deploy app settings to make them live in kintone",
    inputSchema,
    outputSchema,
  },
  async ({ apps, revert }) => {
    const config = parseKintoneClientConfig();
    const client = getKintoneClient(config);

    const params: Parameters<typeof client.app.deployApp>[0] = { apps };

    if (revert !== undefined) {
      params.revert = revert;
    }

    const response = await client.app.deployApp(params);

    return {
      structuredContent: response as { [key: string]: unknown },
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  },
);
