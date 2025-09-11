import { z } from "zod";
import { createTool } from "../../factory.js";
import type { KintoneToolCallback } from "../../types/tool.js";
import { layoutElementSchema } from "../../../schema/app/index.js";

const inputSchema = {
  app: z
    .string()
    .describe(
      "The ID of the app to retrieve form layout from (numeric value as string)",
    ),
  preview: z
    .boolean()
    .optional()
    .describe(
      "Whether to retrieve from preview environment (requires app administration permission for preview, record view/add permission for production)",
    ),
};

const outputSchema = {
  layout: z
    .array(layoutElementSchema)
    .describe("Array of layout elements (rows, subtables, groups)"),
  revision: z.string().describe("App configuration revision number"),
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { app, preview },
  { client },
) => {
  const response = await client.app.getFormLayout({
    app,
    preview,
  });

  const result = {
    layout: response.layout,
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

export const getFormLayout = createTool(
  "kintone-get-form-layout",
  {
    title: "Get Form Layout",
    description: "Get form layout from a kintone app",
    inputSchema,
    outputSchema,
  },
  callback,
);
