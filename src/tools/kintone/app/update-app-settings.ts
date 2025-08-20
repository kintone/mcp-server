import { z } from "zod";
import { createTool } from "../../utils.js";
import { getKintoneClient } from "../../../client.js";
import { parseKintoneClientConfig } from "../../../config.js";

const inputSchema = {
  app: z
    .union([z.number(), z.string()])
    .describe("The ID of the app to update settings for"),
  name: z.string().optional().describe("The app name"),
  description: z.string().optional().describe("The app description"),
  theme: z
    .enum(["WHITE", "RED", "GREEN", "BLUE", "YELLOW", "BLACK"])
    .optional()
    .describe(
      "App theme (WHITE: 初期設定, RED: レッド, GREEN: グリーン, BLUE: ブルー, YELLOW: イエロー, BLACK: ブラック)",
    ),
  revision: z
    .string()
    .optional()
    .describe("App revision number for optimistic locking"),
};

const outputSchema = {
  revision: z.string().describe("Updated app revision number"),
};

export const updateAppSettings = createTool(
  "kintone-update-app-settings",
  {
    description: "Update general settings for a kintone app",
    inputSchema,
    outputSchema,
  },
  async ({ app, name, description, theme, revision }) => {
    const config = parseKintoneClientConfig();
    const client = getKintoneClient(config);

    const updateParams: Parameters<typeof client.app.updateAppSettings>[0] = {
      app,
    };

    if (name !== undefined) updateParams.name = name;
    if (description !== undefined) updateParams.description = description;
    if (theme !== undefined) updateParams.theme = theme;
    if (revision !== undefined) updateParams.revision = revision;

    const response = await client.app.updateAppSettings(updateParams);

    const result = {
      revision: response.revision,
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
