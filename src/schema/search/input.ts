import { z } from "zod";

const searchQuerySchema = z.object({
  operator: z.enum(["AND", "NOT"]).describe("Search operator"),
  keywords: z
    .array(z.string())
    .min(1)
    .describe("Keywords to search for (at least 1 required)"),
});

const searchScopeSchema = z.discriminatedUnion("scope", [
  z.object({
    scope: z.literal("SPACE"),
    ids: z
      .array(z.union([z.number(), z.string()]))
      .optional()
      .nullable()
      .describe("Space IDs to search in"),
  }),
  z.object({
    scope: z.literal("APP"),
    ids: z
      .array(z.union([z.number(), z.string()]))
      .optional()
      .nullable()
      .describe("App IDs to search in"),
  }),
  z.object({
    scope: z.literal("PEOPLE"),
    codes: z
      .array(z.string())
      .optional()
      .nullable()
      .describe("People codes to search in"),
  }),
  z.object({
    scope: z.literal("MESSAGE"),
    codes: z
      .array(z.string())
      .optional()
      .nullable()
      .describe("Message codes to search in"),
  }),
]);

const searchSortSchema = z.union([
  z.object({
    by: z.literal("RELEVANCE").optional().describe("Sort by relevance"),
    order: z.literal("DESC").optional().describe("Order (only DESC)"),
  }),
  z.object({
    by: z.literal("CREATED_AT").describe("Sort by created date"),
    order: z
      .enum(["ASC", "DESC"])
      .optional()
      .describe("Sort order (ASC or DESC)"),
  }),
]);

const searchHitTypeSchema = z.enum([
  "RECORD",
  "RECORD_COMMENT",
  "SPACE",
  "THREAD",
  "THREAD_COMMENT",
  "PEOPLE_COMMENT",
  "MESSAGE_COMMENT",
  "ATTACHMENT",
]);

export const searchInputSchema = {
  query: z
    .tuple([searchQuerySchema])
    .rest(searchQuerySchema)
    .describe("Search queries (at least 1 required)"),
  types: z
    .array(searchHitTypeSchema)
    .optional()
    .nullable()
    .describe("Filter by hit types"),
  scopes: z
    .array(searchScopeSchema)
    .optional()
    .nullable()
    .describe("Scopes to search in"),
  excludeScopes: z
    .array(searchScopeSchema)
    .optional()
    .nullable()
    .describe("Scopes to exclude from search"),
  createdAfter: z
    .string()
    .optional()
    .describe("Filter results created after this date (ISO 8601 format)"),
  createdBefore: z
    .string()
    .optional()
    .describe("Filter results created before this date (ISO 8601 format)"),
  creators: z
    .array(z.string())
    .optional()
    .nullable()
    .describe("Filter by creator codes"),
  sort: searchSortSchema.optional().describe("Sort configuration"),
  limit: z.number().min(1).max(20).default(20).describe("Maximum number of results to return"),
  pageToken: z.string().optional().nullable().describe("Token for pagination. If undefined, null, or empty string, returns the first page. For subsequent pages, specify the nextPageToken from the previous response."),
};
