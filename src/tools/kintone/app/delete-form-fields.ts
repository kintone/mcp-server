import { z } from "zod";
import { createTool } from "../../utils.js";
import { getKintoneClient } from "../../../client.js";
import { parseKintoneClientConfig } from "../../../config.js";

const inputSchema = {
  app: z
    .union([z.number(), z.string()])
    .describe("The ID of the app to delete fields from"),
  fields: z.array(z.string()).describe("Array of field codes to delete"),
  revision: z
    .string()
    .optional()
    .describe("App revision number for optimistic locking"),
};

const outputSchema = {
  revision: z.string().describe("Updated app revision number"),
};

export const deleteFormFields = createTool(
  "kintone-delete-form-fields",
  {
    description: "Delete form fields from a kintone app",
    inputSchema,
    outputSchema,
  },
  async ({ app, fields, revision }) => {
    const config = parseKintoneClientConfig();
    const client = getKintoneClient(config);

    const params: any = {
      app,
      fields,
    };

    if (revision !== undefined) {
      params.revision = revision;
    }

    const response = await client.app.deleteFormFields(params);

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
