import { z } from "zod";
import { createTool } from "../../types.js";
import { getKintoneClient } from "../../../client.js";
import { parseKintoneClientConfig } from "../../../config.js";

const inputSchema = {
  app: z
    .union([z.number(), z.string()])
    .describe("The ID of the app to retrieve process management settings from"),
  lang: z
    .enum(["ja", "en", "zh", "default", "user"])
    .optional()
    .describe("The language for field names"),
};

const entitySchema = z.object({
  type: z.enum([
    "USER",
    "GROUP",
    "ORGANIZATION",
    "FIELD_ENTITY",
    "CREATOR",
    "CUSTOM_FIELD",
  ]),
  code: z.string().nullable(),
});

const entityWithSubsSchema = z.object({
  entity: entitySchema,
  includeSubs: z.boolean(),
});

const stateAssigneeSchema = z.object({
  type: z.enum(["ONE", "ALL", "ANY"]).describe("Assignee type"),
  entities: z.array(entityWithSubsSchema).describe("Assignee entities"),
});

const stateSchema = z.object({
  name: z.string().describe("Status name"),
  index: z.string().describe("Display order"),
  assignee: stateAssigneeSchema
    .optional()
    .describe("Default assignee for the status"),
});

const actionSchema = z.object({
  name: z.string().describe("Action name"),
  from: z.string().describe("Source status name"),
  to: z.string().describe("Destination status name"),
  filterCond: z.string().describe("Branch condition"),
  type: z.enum(["PRIMARY", "SECONDARY"]).describe("Action type"),
  executableUser: z
    .object({
      entities: z
        .array(entityWithSubsSchema)
        .describe("Users who can execute the action"),
    })
    .optional()
    .describe("Executable user settings"),
});

const outputSchema = {
  enable: z.boolean().describe("Whether process management is enabled"),
  states: z
    .record(stateSchema)
    .nullable()
    .describe("Object containing status configurations"),
  actions: z
    .array(actionSchema)
    .nullable()
    .describe("Array containing action configurations"),
  revision: z.string().describe("App settings revision number"),
};

export const getProcessManagement = createTool(
  "kintone-get-process-management",
  {
    description: "Get process management settings from a kintone app",
    inputSchema,
    outputSchema,
  },
  async ({ app, lang }) => {
    const config = parseKintoneClientConfig();
    const client = getKintoneClient(config);

    const response = await client.app.getProcessManagement({
      app,
      lang,
    });

    return {
      structuredContent: response,
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  },
);
