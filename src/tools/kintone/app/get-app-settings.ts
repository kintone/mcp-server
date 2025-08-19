import { z } from "zod";
import { createTool } from "../../utils.js";
import { getKintoneClient } from "../../../client.js";
import { parseKintoneClientConfig } from "../../../config.js";

const inputSchema = {
  app: z
    .union([z.number(), z.string()])
    .describe("The ID of the app to retrieve settings from"),
  lang: z
    .enum(["ja", "en", "zh", "default", "user"])
    .optional()
    .describe("The language for field names"),
};

const outputSchema = {
  name: z.string().describe("The app name"),
  description: z.string().describe("The app description"),
  icon: z
    .object({
      type: z.string().describe("Icon type"),
      key: z.string().describe("Icon key"),
    })
    .describe("App icon settings"),
  theme: z.string().describe("App theme"),
  revision: z.string().describe("App revision number"),
};

export const getAppSettings = createTool(
  "kintone-get-app-settings",
  {
    description: "Get general settings from a kintone app",
    inputSchema,
    outputSchema,
  },
  async ({ app, lang }) => {
    const config = parseKintoneClientConfig();
    const client = getKintoneClient(config);

    const response = await client.app.getAppSettings({
      app,
      lang,
    });

    const result = {
      name: response.name,
      description: response.description,
      icon: response.icon,
      theme: response.theme,
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
