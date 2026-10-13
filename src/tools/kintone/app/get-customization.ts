import { z } from "zod";
import { createTool } from "../../factory.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const inputSchema = {
  app: z
    .string()
    .describe("The ID of the app to retrieve (numeric value as string)"),
  preview: z
    .boolean()
    .optional()
    .describe(
      "Whether to retrieve from preview environment (requires app administration permission for both preview and production)",
    ),
};

const resourceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("URL").describe("The resource type"),
    url: z.string().describe("The resource URL"),
  }),
  z.object({
    type: z.literal("FILE").describe("The resource type"),
    file: z
      .object({
        fileKey: z.string().describe("The file key"),
        name: z.string().describe("The file name"),
        contentType: z.string().describe("The content type of the file"),
        size: z.string().describe("The file size"),
      })
      .describe("The uploaded file information"),
  }),
]);

const customizeSchema = (platform: "desktop" | "mobile") =>
  z.object({
    js: z
      .array(resourceSchema)
      .describe(`The JavaScript resources applied to the ${platform} view`),
    css: z
      .array(resourceSchema)
      .describe(`The CSS resources applied to the ${platform} view`),
  });

const outputSchema = {
  scope: z
    .enum(["ALL", "ADMIN", "NONE"])
    .describe(
      "The scope the customization applies to (ALL: all users, ADMIN: app administrators only, NONE: disabled)",
    ),
  desktop: customizeSchema("desktop").describe(
    "The customization settings for the desktop view",
  ),
  mobile: customizeSchema("mobile").describe(
    "The customization settings for the mobile view",
  ),
  permissions: z
    .array(
      z.object({
        permission: z.string().describe("The permission name"),
      }),
    )
    .optional()
    .describe(
      "The permissions the customization may use (omitted when not available in the environment)",
    ),
  allowedHosts: z
    .array(z.string())
    .optional()
    .describe(
      "The hosts the customization may communicate with (omitted when not available in the environment)",
    ),
  revision: z.string().describe("The revision number"),
};

const toolName = "kintone-get-customization";
const toolConfig = {
  title: "Get Customization",
  description:
    "Get the JavaScript and CSS customization settings of a kintone app. Returns the scope, the JavaScript and CSS resources (URLs or uploaded files) for desktop and mobile, the permissions, the allowed hosts, and the revision. Set preview to true to retrieve the settings in the pre-live environment. Requires app administration permission. Does NOT update the customization settings or download the contents of the files.",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { app, preview },
  { client },
) => {
  const customize = await client.app.getAppCustomize({ app, preview });

  const result = {
    scope: customize.scope,
    desktop: customize.desktop,
    mobile: customize.mobile,
    permissions: customize.permissions,
    allowedHosts: customize.allowedHosts,
    revision: customize.revision,
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

export const getCustomization = createTool(toolName, toolConfig, callback);
