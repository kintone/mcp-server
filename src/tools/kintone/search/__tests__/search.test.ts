import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { search } from "../search.js";
import { z } from "zod";
import {
  createMockClient,
  mockKintoneConfig,
} from "../../../../__tests__/utils.js";

const mockSearch = vi.fn();

describe("search tool", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      ...mockKintoneConfig,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("tool configuration", () => {
    it("should have correct name", () => {
      expect(search.name).toBe("kintone-search");
    });

    it("should have correct description", () => {
      expect(search.config.description).toContain(
        "Search across kintone for records, spaces, threads, comments, and attachments",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(search.config.inputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        {
          input: {
            query: [{ operator: "AND", keywords: ["test"] }],
          },
          description: "minimal query",
        },
        {
          input: {
            query: [
              { operator: "AND", keywords: ["hello", "world"] },
              { operator: "NOT", keywords: ["exclude"] },
            ],
          },
          description: "multiple queries with AND and NOT",
        },
        {
          input: {
            query: [{ operator: "AND", keywords: ["test"] }],
            types: ["RECORD", "SPACE"],
          },
          description: "with types filter",
        },
        {
          input: {
            query: [{ operator: "AND", keywords: ["test"] }],
            scopes: [{ scope: "SPACE", ids: [1, "2"] }],
          },
          description: "with SPACE scope",
        },
        {
          input: {
            query: [{ operator: "AND", keywords: ["test"] }],
            scopes: [{ scope: "APP", ids: ["123"] }],
          },
          description: "with APP scope",
        },
        {
          input: {
            query: [{ operator: "AND", keywords: ["test"] }],
            scopes: [{ scope: "PEOPLE", codes: ["user1"] }],
          },
          description: "with PEOPLE scope",
        },
        {
          input: {
            query: [{ operator: "AND", keywords: ["test"] }],
            scopes: [{ scope: "MESSAGE", codes: ["msg1"] }],
          },
          description: "with MESSAGE scope",
        },
        {
          input: {
            query: [{ operator: "AND", keywords: ["test"] }],
            excludeScopes: [{ scope: "APP", ids: ["456"] }],
          },
          description: "with excludeScopes",
        },
        {
          input: {
            query: [{ operator: "AND", keywords: ["test"] }],
            createdAfter: "2025-01-01T00:00:00Z",
            createdBefore: "2025-12-31T23:59:59Z",
          },
          description: "with date filters",
        },
        {
          input: {
            query: [{ operator: "AND", keywords: ["test"] }],
            creators: ["user1", "user2"],
          },
          description: "with creators filter",
        },
        {
          input: {
            query: [{ operator: "AND", keywords: ["test"] }],
            sort: { by: "RELEVANCE", order: "DESC" },
          },
          description: "with sort by RELEVANCE",
        },
        {
          input: {
            query: [{ operator: "AND", keywords: ["test"] }],
            sort: { by: "CREATED_AT", order: "ASC" },
          },
          description: "with sort by CREATED_AT ASC",
        },
        {
          input: {
            query: [{ operator: "AND", keywords: ["test"] }],
            sort: {},
          },
          description: "with empty sort (defaults to RELEVANCE DESC)",
        },
        {
          input: {
            query: [{ operator: "AND", keywords: ["test"] }],
            limit: 10,
            pageToken: "next-page-token",
          },
          description: "with limit and pageToken",
        },
        {
          input: {
            query: [{ operator: "AND", keywords: ["test"] }],
            types: null,
            scopes: null,
            excludeScopes: null,
            creators: null,
            pageToken: null,
          },
          description: "with nullable fields set to null",
        },
        {
          input: {
            query: [{ operator: "AND", keywords: ["search"] }],
            types: ["RECORD", "ATTACHMENT"],
            scopes: [
              { scope: "APP", ids: ["1", "2"] },
              { scope: "SPACE", ids: [10] },
            ],
            createdAfter: "2025-01-01T00:00:00Z",
            creators: ["admin"],
            sort: { by: "CREATED_AT", order: "DESC" },
            limit: 20,
          },
          description: "full combination of parameters",
        },
      ])("accepts $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).not.toThrow();
      });
    });

    describe("input schema validation with invalid inputs", () => {
      it.each([
        { input: {}, description: "missing required query" },
        {
          input: { query: [] },
          description: "empty query array",
        },
        {
          input: { query: [{ operator: "OR", keywords: ["test"] }] },
          description: "invalid operator (OR)",
        },
        {
          input: { query: [{ operator: "AND", keywords: [] }] },
          description: "empty keywords array",
        },
        {
          input: { query: [{ operator: "AND" }] },
          description: "missing keywords field",
        },
        {
          input: {
            query: [{ operator: "AND", keywords: ["test"] }],
            types: ["INVALID_TYPE"],
          },
          description: "invalid type value",
        },
        {
          input: {
            query: [{ operator: "AND", keywords: ["test"] }],
            scopes: [{ scope: "INVALID" }],
          },
          description: "invalid scope type",
        },
        {
          input: {
            query: [{ operator: "AND", keywords: ["test"] }],
            sort: { by: "INVALID" },
          },
          description: "invalid sort by value",
        },
        {
          input: { query: { operator: "AND", keywords: ["test"] } },
          description: "query as object instead of array",
        },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputSchema = z.object(search.config.outputSchema!);

    describe("output schema validation with valid outputs", () => {
      it.each([
        {
          output: {
            hits: [
              {
                type: "RECORD",
                url: "https://example.cybozu.com/k/1/show#record=1",
                snippets: ["matched text"],
                record: {
                  appId: "1",
                  appName: "Test App",
                  recordId: "1",
                  recordTitle: "Test",
                  createdAt: "2025-01-01T00:00:00Z",
                  creator: { code: "user1", name: "User 1" },
                  matchedFields: [{ code: "title", name: "Title" }],
                },
              },
            ],
            nextPageToken: "token123",
          },
          description: "RECORD hit with nextPageToken",
        },
        {
          output: { hits: [], nextPageToken: null },
          description: "empty hits with null nextPageToken",
        },
        {
          output: {
            hits: [
              {
                type: "SPACE",
                url: "https://example.cybozu.com/k/#/space/1",
                snippets: [],
                space: {
                  spaceId: "1",
                  spaceName: "Test Space",
                  createdAt: "2025-01-01T00:00:00Z",
                  creator: { code: "admin", name: "Admin" },
                },
              },
            ],
            nextPageToken: null,
          },
          description: "SPACE hit",
        },
      ])("accepts $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).not.toThrow();
      });
    });

    describe("output schema validation with invalid outputs", () => {
      it.each([
        { output: {}, description: "missing required fields" },
        {
          output: { hits: null, nextPageToken: null },
          description: "hits as null",
        },
        {
          output: { hits: [] },
          description: "missing nextPageToken",
        },
      ])("rejects $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).toThrow();
      });
    });
  });

  describe("callback function", () => {
    it("should call client.search with correct parameters and return formatted response", async () => {
      const mockResponse = {
        hits: [
          {
            type: "RECORD",
            url: "https://example.cybozu.com/k/1/show#record=1",
            snippets: ["matched text"],
            record: {
              appId: "1",
              appName: "Test App",
              recordId: "1",
              recordTitle: "Test Record",
              createdAt: "2025-01-01T00:00:00Z",
              creator: { code: "user1", name: "User 1" },
              matchedFields: [{ code: "title", name: "Title" }],
            },
          },
        ],
        nextPageToken: null,
      };

      mockSearch.mockResolvedValueOnce(mockResponse);

      const input = {
        query: [{ operator: "AND" as const, keywords: ["test"] }],
      };

      const mockClient = createMockClient();
      mockClient.search = mockSearch;

      const result = await search.callback(input, { client: mockClient });

      expect(mockSearch).toHaveBeenCalledWith({
        query: [{ operator: "AND", keywords: ["test"] }],
      });
      expect(result.structuredContent).toEqual(mockResponse);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockResponse, null, 2),
      });
    });

    it("should pass through all optional parameters", async () => {
      const mockResponse = { hits: [], nextPageToken: null };
      mockSearch.mockResolvedValueOnce(mockResponse);

      const input = {
        query: [{ operator: "AND" as const, keywords: ["search"] }],
        types: ["RECORD" as const, "SPACE" as const],
        scopes: [{ scope: "APP" as const, ids: ["1"] }],
        createdAfter: "2025-01-01T00:00:00Z",
        creators: ["admin"],
        sort: { by: "CREATED_AT" as const, order: "DESC" as const },
        limit: 10,
      };

      const mockClient = createMockClient();
      mockClient.search = mockSearch;

      await search.callback(input, { client: mockClient });

      expect(mockSearch).toHaveBeenCalledWith(input);
    });

    it("should handle empty results", async () => {
      const mockResponse = { hits: [], nextPageToken: null };
      mockSearch.mockResolvedValueOnce(mockResponse);

      const input = {
        query: [{ operator: "AND" as const, keywords: ["nonexistent"] }],
      };

      const mockClient = createMockClient();
      mockClient.search = mockSearch;

      const result = await search.callback(input, { client: mockClient });

      expect(result.structuredContent).toEqual(mockResponse);
    });

    it("should handle API errors properly", async () => {
      const mockError = new Error("API Error: Authentication required");
      mockSearch.mockRejectedValueOnce(mockError);

      const input = {
        query: [{ operator: "AND" as const, keywords: ["test"] }],
      };

      const mockClient = createMockClient();
      mockClient.search = mockSearch;

      await expect(
        search.callback(input, { client: mockClient }),
      ).rejects.toThrow("API Error: Authentication required");
    });
  });
});
