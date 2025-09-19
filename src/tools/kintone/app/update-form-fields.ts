import { z } from "zod";
import { createTool } from "../../factory.js";
import type { KintoneToolCallback } from "../../types/tool.js";
import { propertiesForParameterSchema } from "../../../schema/app/index.js";

const inputSchema = {
  app: z
    .string()
    .describe(
      "The ID of the app to update form fields for (numeric value as string)",
    ),
  properties: propertiesForParameterSchema.describe(
    "Object containing field configurations to update",
  ),
  revision: z
    .string()
    .optional()
    .describe(
      "Expected app configuration revision number. If the specified revision number does not match the current app's revision, an error will occur and the update will not be performed. If not specified or set to '-1', the revision number will not be checked.",
    ),
};

const outputSchema = {
  revision: z.string().describe("Updated app configuration revision number"),
};

const toolName = "kintone-update-form-fields";
const toolConfig = {
  title: "Update Form Fields",
  description:
    "Update form field settings in a kintone app (preview environment only). Requires App Management permissions. Cannot update field codes for Label, Blank space, Border, Status, Assignee, or Category fields. For selection fields, unspecified options will be deleted. Option keys must exactly match current option names. New options require 'label' and 'index'. Field codes: max 128 chars, cannot start with numbers, only '_' symbol allowed. Duplicate field codes not allowed. Use kintone-get-form-fields first to check current settings. Changes require kintone-deploy-app to apply to live app.",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { app, properties, revision },
  { client },
) => {
  const response = await client.app.updateFormFields({
    app,
    properties: properties,
    revision,
  });

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

export const updateFormFields = createTool(toolName, toolConfig, callback);
