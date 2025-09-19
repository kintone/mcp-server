import { z } from "zod";
import { createTool } from "../../factory.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const inputSchema = {
  app: z
    .string()
    .describe(
      "The ID of the app to delete form fields from (numeric value as string)",
    ),
  fields: z
    .array(z.string())
    .min(1, "At least one field code is required")
    .max(100, "Maximum 100 fields can be deleted at once")
    .describe("Array of field codes to delete"),
  revision: z
    .string()
    .optional()
    .describe(
      "Expected app configuration revision number. If the specified revision number does not match the current app's revision, an error will occur and the update will not be performed. If not specified or set to '-1', the revision number will not be checked.",
    ),
};

const outputSchema = {
  revision: z.string().describe("The new revision number after deletion"),
};

const toolName = "kintone-delete-form-fields";
const toolConfig = {
  title: "Delete Form Fields",
  description:
    "Delete form fields from a kintone app (preview environment only). Maximum 100 fields can be deleted at once. Cannot delete status, assignee, or category fields.",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { app, fields, revision },
  { client },
) => {
  const response = (await client.app.deleteFormFields({
    app,
    fields,
    revision,
  })) as { revision: string };

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
};

export const deleteFormFields = createTool(toolName, toolConfig, callback);
