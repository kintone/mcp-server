import { z } from "zod";
import { createTool } from "../../factory.js";
import { permissionsSchema } from "../../../schema/space/index.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const inputSchema = {
  id: z
    .string()
    .describe(
      "Space ID as returned by Kintone (numeric string). Same value as in space URLs and other Space APIs.",
    ),
  name: z
    .string()
    .max(128)
    .optional()
    .describe(
      "Space name (max 128 characters). Omit to keep the existing name.",
    ),
  isPrivate: z
    .boolean()
    .optional()
    .describe(
      "Whether the space is private. true = private, false = public. Omit to keep the existing setting.",
    ),
  fixedMember: z
    .boolean()
    .optional()
    .describe(
      "Whether to block members from joining or leaving the space on their own. true = block, false = allow. Omit to keep the existing setting.",
    ),
  useMultiThread: z
    .boolean()
    .optional()
    .describe(
      "Whether to enable multiple threads. The kintone REST API only applies this when true (switching a single-thread space to multi-thread); passing false or omitting it leaves the current setting unchanged.",
    ),
  showAnnouncement: z
    .boolean()
    .optional()
    .describe(
      "Whether the Announcement widget is shown on the space portal. Applies only to multi-thread spaces.",
    ),
  showThreadList: z
    .boolean()
    .optional()
    .describe(
      "Whether the Threads widget is shown on the space portal. Applies only to multi-thread spaces.",
    ),
  showAppList: z
    .boolean()
    .optional()
    .describe(
      "Whether the Apps widget is shown on the space portal. Applies only to multi-thread spaces.",
    ),
  showMemberList: z
    .boolean()
    .optional()
    .describe(
      "Whether the People widget is shown on the space portal. Applies only to multi-thread spaces.",
    ),
  showRelatedLinkList: z
    .boolean()
    .optional()
    .describe(
      "Whether the Related Apps & Spaces widget is shown on the space portal. Applies only to multi-thread spaces.",
    ),
  permissions: permissionsSchema
    .optional()
    .describe(
      "Space-level permission settings. Omit to keep the existing settings.",
    ),
};

const outputSchema = {};

const toolName = "kintone-update-space";
const toolConfig = {
  title: "Update Space",
  description:
    "Update settings of a kintone space via the Space REST API (PUT /k/v1/space.json). " +
    "Modifies space configuration such as name, privacy, member lock, multi-thread mode, portal widget visibility, and who may create apps (EVERYONE vs ADMIN). " +
    "Only fields included in the request are updated; omitted fields keep their existing values. " +
    "useMultiThread is applied only when true (single-thread to multi-thread switch); passing false has no effect. " +
    "Requires space administrator privileges on the target space. The API returns an empty body on success.",
  inputSchema,
  outputSchema,
};
const callback: KintoneToolCallback<typeof inputSchema> = async (
  {
    id,
    name,
    isPrivate,
    fixedMember,
    useMultiThread,
    showAnnouncement,
    showThreadList,
    showAppList,
    showMemberList,
    showRelatedLinkList,
    permissions,
  },
  { client },
) => {
  await client.space.updateSpace({
    id,
    name,
    isPrivate,
    fixedMember,
    useMultiThread,
    showAnnouncement,
    showThreadList,
    showAppList,
    showMemberList,
    showRelatedLinkList,
    permissions,
  });

  return {
    structuredContent: {},
    content: [],
  };
};

export const updateSpace = createTool(toolName, toolConfig, callback);
