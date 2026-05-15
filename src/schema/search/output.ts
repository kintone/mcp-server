import { z } from "zod";

const searchUserSchema = z.object({
  code: z.string(),
  name: z.string(),
});

const idSchema = z.union([z.number(), z.string()]);

const searchHitRecordSchema = z.object({
  appId: idSchema,
  appName: z.string(),
  recordId: idSchema,
  recordTitle: z.string(),
  createdAt: z.string(),
  creator: searchUserSchema,
  matchedFields: z.array(z.object({ code: z.string(), name: z.string() })),
  spaceId: idSchema.optional(),
  spaceName: z.string().optional(),
});

const searchHitRecordCommentSchema = z.object({
  appId: idSchema,
  appName: z.string(),
  recordId: idSchema,
  recordTitle: z.string(),
  commentId: idSchema,
  createdAt: z.string(),
  creator: searchUserSchema,
  spaceId: idSchema.optional(),
  spaceName: z.string().optional(),
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
  replyId: idSchema.optional(),
  spaceId: idSchema,
  spaceName: z.string(),
  threadId: idSchema,
  threadName: z.string(),
  createdAt: z.string(),
  creator: searchUserSchema,
});

const searchHitPeopleCommentSchema = z.object({
  commentId: idSchema,
  replyId: idSchema.optional(),
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
  createdAt: z.string(),
  creator: searchUserSchema,
});

const hitBase = { url: z.string(), snippets: z.array(z.string()) };

const searchHitSchema = z.union([
  z.object({ ...hitBase, type: z.literal("RECORD"), record: searchHitRecordSchema }),
  z.object({ ...hitBase, type: z.literal("RECORD_COMMENT"), recordComment: searchHitRecordCommentSchema }),
  z.object({ ...hitBase, type: z.literal("SPACE"), space: searchHitSpaceSchema }),
  z.object({ ...hitBase, type: z.literal("THREAD"), thread: searchHitThreadSchema }),
  z.object({ ...hitBase, type: z.literal("THREAD_COMMENT"), threadComment: searchHitThreadCommentSchema }),
  z.object({ ...hitBase, type: z.literal("PEOPLE_COMMENT"), peopleComment: searchHitPeopleCommentSchema }),
  z.object({ ...hitBase, type: z.literal("MESSAGE_COMMENT"), messageComment: searchHitMessageCommentSchema }),
  z.object({ ...hitBase, type: z.literal("ATTACHMENT"), attachment: attachmentBaseSchema.extend({ attachedTo: z.literal("RECORD") }), record: searchHitRecordSchema }),
  z.object({ ...hitBase, type: z.literal("ATTACHMENT"), attachment: attachmentBaseSchema.extend({ attachedTo: z.literal("SPACE") }), space: searchHitSpaceSchema }),
  z.object({ ...hitBase, type: z.literal("ATTACHMENT"), attachment: attachmentBaseSchema.extend({ attachedTo: z.literal("THREAD") }), thread: searchHitThreadSchema }),
  z.object({ ...hitBase, type: z.literal("ATTACHMENT"), attachment: attachmentBaseSchema.extend({ attachedTo: z.literal("THREAD_COMMENT") }), threadComment: searchHitThreadCommentSchema }),
  z.object({ ...hitBase, type: z.literal("ATTACHMENT"), attachment: attachmentBaseSchema.extend({ attachedTo: z.literal("PEOPLE_COMMENT") }), peopleComment: searchHitPeopleCommentSchema }),
  z.object({ ...hitBase, type: z.literal("ATTACHMENT"), attachment: attachmentBaseSchema.extend({ attachedTo: z.literal("MESSAGE_COMMENT") }), messageComment: searchHitMessageCommentSchema }),
]);

export const searchOutputSchema = {
  hits: z.array(searchHitSchema).describe("Array of search hits"),
  nextPageToken: z.string().nullable().describe("Token for fetching the next page of results"),
};
