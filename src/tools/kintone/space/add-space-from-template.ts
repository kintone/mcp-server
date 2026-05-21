import { z } from "zod";
import { createTool } from "../../factory.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const inputSchema = {
  id: z
    .string()
    .describe(
      "The Space Template ID (numeric value as string). Available on the Space Templates list page under kintone System Administration.",
    ),
  name: z.string().min(1).describe("The name of the new space."),
  members: z
    .array(
      z.object({
        entity: z
          .object({
            type: z
              .enum(["USER", "GROUP", "ORGANIZATION"])
              .describe(
                "Entity type: USER (individual user), GROUP (role/group), or ORGANIZATION (department).",
              ),
            code: z
              .string()
              .describe(
                "Entity code: login name for USER, group code for GROUP, organization code for ORGANIZATION.",
              ),
          })
          .describe(
            "The entity (user, group, or organization) granted membership.",
          ),
        isAdmin: z
          .boolean()
          .optional()
          .default(false)
          .describe(
            "Whether this member is a space administrator. At least one member in the array must have isAdmin set to true (default: false).",
          ),
        includeSubs: z
          .boolean()
          .optional()
          .default(false)
          .describe(
            "For ORGANIZATION entity, also include affiliated departments. Ignored for USER and GROUP entities (default: false).",
          ),
      }),
    )
    .min(1)
    .describe(
      "Array of space members. Must contain at least one entry and at least one of them must have isAdmin: true.",
    ),
  isPrivate: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Whether the new space is private. Private spaces are visible only to the listed members (default: false).",
    ),
  isGuest: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Whether to create a guest space. Can be set to true only when the supplied template is a guest space template (default: false).",
    ),
  fixedMember: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Whether to block members from joining or leaving the space on their own (default: false).",
    ),
};

const outputSchema = {
  id: z
    .string()
    .describe("The ID of the newly created space (numeric value as string)."),
};

const toolName = "kintone-add-space-from-template";
const toolConfig = {
  title: "Add Space From Template",
  description:
    "Create a new kintone space from an existing space template via POST /k/v1/template/space.json. " +
    "Requires permission to create spaces from templates (typically a kintone System Administrator, or a user explicitly granted space-creation rights). " +
    "The members array must contain at least one entry with isAdmin: true; otherwise the API rejects the request. " +
    "To create a guest space, the supplied template id must be a guest space template and isGuest must be true. " +
    "The space is created immediately on the production environment (no deploy step); this operation is not reversible from this tool. " +
    "Returns the id of the newly created space.",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { id, name, members, isPrivate, isGuest, fixedMember },
  { client },
) => {
  const response = await client.space.addSpaceFromTemplate({
    id,
    name,
    members,
    isPrivate,
    isGuest,
    fixedMember,
  });
  const result = {
    id: response.id,
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

export const addSpaceFromTemplate = createTool(toolName, toolConfig, callback);
