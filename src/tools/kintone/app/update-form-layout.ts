import { z } from "zod";
import { createTool } from "../../factory.js";
import type { KintoneToolCallback } from "../../types/tool.js";
import { layoutElementSchema } from "../../../schema/app/index.js";

const inputSchema = {
  app: z
    .string()
    .describe(
      "The ID of the app to update form layout for (numeric value as string)",
    ),
  layout: z
    .array(layoutElementSchema)
    .describe("Array of layout elements (rows, subtables, groups)"),
  revision: z
    .string()
    .optional()
    .describe("The expected app configuration revision number before updating"),
};

const outputSchema = {
  revision: z.string().describe("Updated app configuration revision number"),
};

const toolName = "kintone-update-form-layout";
const toolConfig = {
  title: "Update Form Layout",
  description:
    "Update form layout settings in a kintone app (test environment)",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { app, layout, revision },
  { client },
) => {
  const response = await client.app.updateFormLayout({
    app,
    layout: layout as any,
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

export const updateFormLayout = createTool(toolName, toolConfig, callback);
