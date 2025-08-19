import { z } from "zod";
import { createTool } from "../../utils.js";
import { getKintoneClient } from "../../../client.js";
import { parseKintoneClientConfig } from "../../../config.js";
import { fieldPropertySchema } from "../../../schema/field-schemas.js";

const inputSchema = {
  app: z
    .union([z.number(), z.string()])
    .describe("The ID of the app to add fields to"),
  properties: z
    .record(fieldPropertySchema)
    .describe("Object containing field configurations to add"),
  revision: z
    .string()
    .optional()
    .describe("App revision number for optimistic locking"),
};

const outputSchema = {
  revision: z.string().describe("Updated app revision number"),
};

export const addFormFields = createTool(
  "kintone-add-form-fields",
  {
    description: "Add form fields to a kintone app",
    inputSchema,
    outputSchema,
  },
  async ({ app, properties, revision }) => {
    const config = parseKintoneClientConfig();
    const client = getKintoneClient(config);

    const params: any = {
      app,
      properties,
    };

    if (revision !== undefined) {
      params.revision = revision;
    }

    const response = await client.app.addFormFields(params);

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
