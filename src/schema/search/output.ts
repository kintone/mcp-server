import { z } from "zod";

const searchUserSchema = z.object({
  code: z.string(),
  name: z.string(),
});

const idSchema = z.union([z.number(), z.string()]);

// Fields that do not apply to a hit come back as null (older servers omit
// them instead), so accept both. A flat union instead of
// idSchema.nullable(): the JSON Schema override in tool-definitions.ts
// sees the nested union before it has a type and advertises just "null".
const optionalIdSchema = z.union([z.number(), z.string(), z.null()]).optional();
const optionalNameSchema = z.string().nullable().optional();

const searchHitRecordSchema = z.object({
  appId: idSchema,
  appName: z.string(),
  recordId: idSchema,
  recordTitle: z.string(),
  // null when the user cannot view the record's Created datetime / Created by
  createdAt: z.string().nullable().optional(),
  creator: searchUserSchema.nullable().optional(),
  matchedFields: z.array(z.object({ code: z.string(), label: z.string() })),
  spaceId: optionalIdSchema,
  spaceName: optionalNameSchema,
});

const searchHitRecordCommentSchema = z.object({
  appId: idSchema,
  appName: z.string(),
  recordId: idSchema,
  recordTitle: z.string(),
  commentId: idSchema,
  createdAt: z.string(),
  creator: searchUserSchema,
  spaceId: optionalIdSchema,
  spaceName: optionalNameSchema,
});

const searchHitSpaceSchema = z.object({
  spaceId: idSchema,
  spaceName: z.string(),
  createdAt: z.string(),
  creator: searchUserSchema,
});

const searchHitThreadSchema = z.object({
  spaceId: idSchema,
  spaceName: z.string(),
  threadId: idSchema,
  threadName: z.string(),
  createdAt: z.string(),
  creator: searchUserSchema,
});

const searchHitThreadCommentSchema = z.object({
  commentId: idSchema,
  replyId: optionalIdSchema,
  spaceId: idSchema,
  spaceName: z.string(),
  threadId: idSchema,
  threadName: z.string(),
  createdAt: z.string(),
  creator: searchUserSchema,
});

const searchHitPeopleCommentSchema = z.object({
  commentId: idSchema,
  replyId: optionalIdSchema,
  owner: searchUserSchema,
  createdAt: z.string(),
  creator: searchUserSchema,
});

const searchHitMessageCommentSchema = z.object({
  commentId: idSchema,
  recipient: searchUserSchema,
  createdAt: z.string(),
  creator: searchUserSchema,
});

const attachmentBaseSchema = z.object({
  fileKey: z.string(),
  name: z.string(),
  // The API may return null for any attachment; in practice it does so for a
  // record attachment when the user cannot view those fields of the record
  createdAt: z.string().nullable().optional(),
  creator: searchUserSchema.nullable().optional(),
});

const hitBase = { url: z.string(), snippets: z.array(z.string()) };

const searchHitSchema = z.union([
  z.object({
    ...hitBase,
    type: z.literal("RECORD"),
    record: searchHitRecordSchema,
  }),
  z.object({
    ...hitBase,
    type: z.literal("RECORD_COMMENT"),
    recordComment: searchHitRecordCommentSchema,
  }),
  z.object({
    ...hitBase,
    type: z.literal("SPACE"),
    space: searchHitSpaceSchema,
  }),
  z.object({
    ...hitBase,
    type: z.literal("THREAD"),
    thread: searchHitThreadSchema,
  }),
  z.object({
    ...hitBase,
    type: z.literal("THREAD_COMMENT"),
    threadComment: searchHitThreadCommentSchema,
  }),
  z.object({
    ...hitBase,
    type: z.literal("PEOPLE_COMMENT"),
    peopleComment: searchHitPeopleCommentSchema,
  }),
  z.object({
    ...hitBase,
    type: z.literal("MESSAGE_COMMENT"),
    messageComment: searchHitMessageCommentSchema,
  }),
  z.object({
    ...hitBase,
    type: z.literal("ATTACHMENT"),
    attachment: attachmentBaseSchema.extend({
      attachedTo: z.literal("RECORD"),
    }),
    record: searchHitRecordSchema,
  }),
  z.object({
    ...hitBase,
    type: z.literal("ATTACHMENT"),
    attachment: attachmentBaseSchema.extend({ attachedTo: z.literal("SPACE") }),
    space: searchHitSpaceSchema,
  }),
  z.object({
    ...hitBase,
    type: z.literal("ATTACHMENT"),
    attachment: attachmentBaseSchema.extend({
      attachedTo: z.literal("THREAD"),
    }),
    thread: searchHitThreadSchema,
  }),
  z.object({
    ...hitBase,
    type: z.literal("ATTACHMENT"),
    attachment: attachmentBaseSchema.extend({
      attachedTo: z.literal("THREAD_COMMENT"),
    }),
    threadComment: searchHitThreadCommentSchema,
  }),
  z.object({
    ...hitBase,
    type: z.literal("ATTACHMENT"),
    attachment: attachmentBaseSchema.extend({
      attachedTo: z.literal("PEOPLE_COMMENT"),
    }),
    peopleComment: searchHitPeopleCommentSchema,
  }),
  z.object({
    ...hitBase,
    type: z.literal("ATTACHMENT"),
    attachment: attachmentBaseSchema.extend({
      attachedTo: z.literal("MESSAGE_COMMENT"),
    }),
    messageComment: searchHitMessageCommentSchema,
  }),
]);

export const searchOutputSchema = {
  hits: z.array(searchHitSchema).describe("Array of search hits"),
  nextPageToken: z
    .string()
    .nullable()
    .describe("Token for fetching the next page of results"),
};
