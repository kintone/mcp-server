import { z } from "zod";
import { createTool } from "../../factory.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const inputSchema = {
  app: z
    .string()
    .describe("The ID of the app to update (numeric value as string)"),
  name: z
    .string()
    .min(1)
    .max(64)
    .optional()
    .describe("The app name (1-64 characters)"),
  description: z
    .string()
    .max(10000)
    .optional()
    .describe("The app description (up to 10,000 characters)"),
  icon: z
    .object({
      type: z.enum(["PRESET", "FILE"]).describe("The icon type"),
      key: z.string().optional().describe("The icon key for PRESET type"),
      file: z
        .object({
          fileKey: z.string().describe("The file key for uploaded icon"),
        })
        .optional()
        .describe("The file information for FILE type"),
    })
    .optional()
    .describe("The app icon configuration"),
  theme: z
    .enum([
      "WHITE",
      "CLIPBOARD",
      "BINDER",
      "PENCIL",
      "CLIPS",
      "RED",
      "BLUE",
      "GREEN",
      "YELLOW",
      "BLACK",
    ])
    .optional()
    .describe("The design theme"),
  titleField: z
    .object({
      type: z
        .enum(["RECORD_NUMBER", "SINGLE_LINE_TEXT"])
        .describe("The field type for record title"),
      value: z
        .string()
        .optional()
        .describe("The field code for SINGLE_LINE_TEXT type"),
    })
    .optional()
    .describe("The record title field settings"),
  enableThumbnails: z
    .boolean()
    .optional()
    .describe("Whether to enable thumbnail display"),
  enableComments: z
    .boolean()
    .optional()
    .describe("Whether to enable record comments"),
  numberPrecision: z
    .number()
    .min(0)
    .max(20)
    .optional()
    .describe("The numeric calculation precision (0-20)"),
};

const outputSchema = {
  revision: z.string().describe("The revision number after the update"),
};

const toolName = "kintone-update-general-settings";
const toolConfig = {
  title: "Update General Settings",
  description: "Update the general settings of a kintone app",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  {
    app,
    name,
    description,
    icon,
    theme,
    titleField,
    enableThumbnails,
    enableComments,
    numberPrecision,
  },
  { client },
) => {
  const params: any = { app };
  if (name !== undefined) params.name = name;
  if (description !== undefined) params.description = description;
  if (icon !== undefined) params.icon = icon;
  if (theme !== undefined) params.theme = theme;
  if (titleField !== undefined) params.titleField = titleField;
  if (enableThumbnails !== undefined)
    params.enableThumbnails = enableThumbnails;
  if (enableComments !== undefined) params.enableComments = enableComments;
  if (numberPrecision !== undefined) params.numberPrecision = numberPrecision;

  const response = await client.app.updateAppSettings(params);
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

export const updateGeneralSettings = createTool(toolName, toolConfig, callback);
