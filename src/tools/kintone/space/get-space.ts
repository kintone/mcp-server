import { z } from "zod";
import { createTool } from "../../factory.js";
import { spaceSchema } from "../../../schema/space/index.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const inputSchema = {
  id: z
    .string()
    .describe(
      "Space ID as returned by Kintone (numeric string). Same value as in space URLs and other Space APIs.",
    ),
};

const outputSchema = spaceSchema.shape;

const toolName = "kintone-get-space";
const toolDescription =
  "Retrieve a kintone space via the Space REST API (GET /k/v1/space.json). " +
  "Read-only: returns metadata and portal content such as name, default thread, privacy, HTML body, cover image, " +
  "widget visibility, member count, attached apps, and who may create apps (EVERYONE vs ADMIN). " +
  "Requires permission to view the target space. Does not modify any space configuration.";

const toolConfig = {
  title: "Get Space",
  description: toolDescription,
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { id },
  { client },
) => {
  const space = await client.space.getSpace({ id });
  const result = {
    id: space.id,
    name: space.name,
    defaultThread: space.defaultThread,
    isPrivate: space.isPrivate,
    creator: space.creator,
    modifier: space.modifier,
    memberCount: space.memberCount,
    coverType: space.coverType,
    coverKey: space.coverKey,
    coverUrl: space.coverUrl,
    body: space.body,
    useMultiThread: space.useMultiThread,
    isGuest: space.isGuest,
    attachedApps: space.attachedApps,
    fixedMember: space.fixedMember,
    showAnnouncement: space.showAnnouncement,
    showThreadList: space.showThreadList,
    showAppList: space.showAppList,
    showMemberList: space.showMemberList,
    showRelatedLinkList: space.showRelatedLinkList,
    permissions: space.permissions,
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

export const getSpace = createTool(toolName, toolConfig, callback);
