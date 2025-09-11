import { z } from "zod";
import { createTool } from "../../factory.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const inputSchema = {
  app: z
    .string()
    .describe("The ID of the app to retrieve (numeric value as string)"),
  lang: z
    .enum(["ja", "en", "zh", "default", "user"])
    .optional()
    .describe("The language for retrieving the app name and description"),
  preview: z
    .boolean()
    .optional()
    .describe(
      "Whether to retrieve from preview environment (requires app administration permission for preview, record view/add permission for production)",
    ),
};

const outputSchema = {
  name: z.string().describe("The app name"),
  description: z.string().describe("The app description"),
  icon: z
    .object({
      type: z.enum(["FILE", "PRESET"]).describe("The icon type"),
      key: z.string().describe("The icon key"),
      file: z
        .object({
          contentType: z.string().describe("The content type of the file"),
          fileKey: z.string().describe("The file key"),
          name: z.string().describe("The file name"),
          size: z.string().describe("The file size"),
        })
        .optional()
        .describe("File information (only when type is FILE)"),
    })
    .describe("The app icon settings"),
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
    .describe("The app theme"),
  titleField: z
    .object({
      selectionMode: z
        .enum(["AUTO", "MANUAL"])
        .describe("Title field selection mode"),
      code: z.string().optional().describe("Field code for manual selection"),
    })
    .describe("Record title field configuration"),
  enableThumbnails: z.boolean().describe("Whether thumbnails are enabled"),
  enableBulkDeletion: z
    .boolean()
    .describe("Whether bulk record deletion is enabled"),
  enableComments: z.boolean().describe("Whether comments are enabled"),
  enableDuplicateRecord: z
    .boolean()
    .describe("Whether record duplication is enabled"),
  enableInlineRecordEditing: z
    .boolean()
    .describe("Whether inline record editing is enabled"),
  numberPrecision: z
    .object({
      digits: z
        .number()
        .min(1)
        .max(30)
        .describe("The number of digits (1 to 30)"),
      decimalPlaces: z
        .number()
        .min(0)
        .max(10)
        .describe("The number of decimal places (0 to 10)"),
      roundingMode: z
        .enum(["HALF_EVEN", "UP", "DOWN"])
        .describe("The rounding mode"),
    })
    .describe("The numeric calculation settings"),
  firstMonthOfFiscalYear: z
    .number()
    .min(1)
    .max(12)
    .describe("The first month of the fiscal year (1-12)"),
  revision: z.string().describe("The revision number"),
};

const toolName = "kintone-get-general-settings";
const toolConfig = {
  title: "Get General Settings",
  description: "Get general settings of a kintone app",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { app, lang, preview },
  { client },
) => {
  const settings = await client.app.getAppSettings({ app, lang, preview });

  const result = {
    name: settings.name,
    description: settings.description,
    icon: settings.icon,
    theme: settings.theme,
    titleField: settings.titleField,
    enableThumbnails: settings.enableThumbnails,
    enableBulkDeletion: settings.enableBulkDeletion,
    enableComments: settings.enableComments,
    enableDuplicateRecord: settings.enableDuplicateRecord,
    // @ts-ignore - enableInlineRecordEditing is not yet in the Kintone SDK types but exists in API response
    enableInlineRecordEditing: settings.enableInlineRecordEditing,
    numberPrecision: settings.numberPrecision,
    firstMonthOfFiscalYear: settings.firstMonthOfFiscalYear,
    revision: settings.revision,
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

export const getGeneralSettings = createTool(toolName, toolConfig, callback);
