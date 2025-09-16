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
    .discriminatedUnion("type", [
      z.object({
        type: z.literal("PRESET"),
        key: z.string().describe("The icon key for PRESET type"),
      }),
      z.object({
        type: z.literal("FILE"),
        file: z
          .object({
            fileKey: z.string().describe("The file key for uploaded icon"),
          })
          .describe("The file information for FILE type"),
      }),
    ])
    .optional()
    .describe("The app icon configuration"),
  theme: z
    .enum(["WHITE", "RED", "GREEN", "BLUE", "YELLOW", "BLACK"])
    .optional()
    .describe("The design theme"),
  titleField: z
    .discriminatedUnion("selectionMode", [
      z.object({
        selectionMode: z.literal("AUTO"),
      }),
      z.object({
        selectionMode: z.literal("MANUAL"),
        code: z.string().describe("The field code for MANUAL selection mode"),
      }),
    ])
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
  enableBulkDeletion: z
    .boolean()
    .optional()
    .describe("Whether to enable bulk deletion of records"),
  enableDuplicateRecord: z
    .boolean()
    .optional()
    .describe("Whether to enable the reuse record feature"),
  enableInlineRecordEditing: z
    .boolean()
    .optional()
    .describe("Whether to enable inline editing in record list"),
  numberPrecision: z
    .object({
      digits: z
        .string()
        .regex(/^\d+$/, "Must be a numeric string")
        .refine((val) => {
          const num = parseInt(val, 10);
          return num >= 1 && num <= 30;
        }, "Must be between 1 and 30")
        .optional()
        .describe("Total number of digits (1-30)"),
      decimalPlaces: z
        .string()
        .regex(/^\d+$/, "Must be a numeric string")
        .refine((val) => {
          const num = parseInt(val, 10);
          return num >= 0 && num <= 10;
        }, "Must be between 0 and 10")
        .optional()
        .describe("Number of decimal places (0-10)"),
      roundingMode: z
        .enum(["HALF_EVEN", "UP", "DOWN"])
        .optional()
        .describe("Rounding method"),
    })
    .optional()
    .describe("The numeric calculation precision settings"),
  firstMonthOfFiscalYear: z
    .string()
    .regex(/^\d+$/, "Must be a numeric string")
    .refine((val) => {
      const num = parseInt(val, 10);
      return num >= 1 && num <= 12;
    }, "Must be between 1 and 12")
    .optional()
    .describe("The first month of the fiscal year (1-12)"),
  revision: z
    .string()
    .optional()
    .describe("Expected revision number for optimistic locking"),
};

const outputSchema = {
  revision: z.string().describe("The revision number after the update"),
};

const toolName = "kintone-update-general-settings";
const toolConfig = {
  title: "Update General Settings",
  description:
    "Update the general settings of a kintone app. Changes are made to the pre-live environment, which is a temporary storage area where app information is saved before deployment. To reflect changes to the production environment, execute the kintone-deploy-app tool after this tool.",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  params,
  { client },
) => {
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
