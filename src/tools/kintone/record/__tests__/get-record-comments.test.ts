import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getRecordComments } from "../get-record-comments.js";
import { z } from "zod";
import {
  createMockClient,
  mockKintoneConfig,
} from "../../../../__tests__/utils.js";

const mockGetRecordComments = vi.fn();

describe("get-record-comments tool", () => {
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
      expect(getRecordComments.name).toBe("kintone-get-record-comments");
    });

    it("should have correct description", () => {
      expect(getRecordComments.config.description).toBe(
        "Get comments posted on a single kintone record. The kintone API returns comments for one record at a time; to fetch comments for multiple records, call this tool repeatedly. Up to 10 comments are returned per call; use offset to paginate.",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(getRecordComments.config.inputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        {
          input: { app: "1", record: "10" },
          description: "minimum required fields",
        },
        {
          input: {
            app: "1",
            record: "10",
            order: "asc",
            limit: 10,
            offset: 0,
          },
          description: "all fields with order asc",
        },
        {
          input: { app: "1", record: "10", order: "desc" },
          description: "with order desc only",
        },
        {
          input: { app: "1", record: "10", limit: 1 },
          description: "limit at lower bound",
        },
        {
          input: { app: "1", record: "10", limit: 10 },
          description: "limit at upper bound",
        },
        {
          input: { app: "1", record: "10", offset: 100 },
          description: "with large offset",
        },
      ])("accepts $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).not.toThrow();
      });
    });

    describe("input schema validation with invalid inputs", () => {
      it.each([
        { input: {}, description: "missing all required fields" },
        { input: { app: "1" }, description: "missing record" },
        { input: { record: "10" }, description: "missing app" },
        { input: { app: 1, record: "10" }, description: "app as number" },
        { input: { app: null, record: "10" }, description: "app as null" },
        { input: { app: true, record: "10" }, description: "app as boolean" },
        { input: { app: "1", record: 10 }, description: "record as number" },
        {
          input: { app: "1", record: "10", order: "ascending" },
          description: "order with invalid value",
        },
        {
          input: { app: "1", record: "10", limit: 0 },
          description: "limit below minimum",
        },
        {
          input: { app: "1", record: "10", limit: 11 },
          description: "limit above maximum",
        },
        {
          input: { app: "1", record: "10", offset: -1 },
          description: "negative offset",
        },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputSchema = z.object(getRecordComments.config.outputSchema!);

    describe("output schema validation with valid outputs", () => {
      it.each([
        {
          output: {
            comments: [],
            older: false,
            newer: false,
          },
          description: "empty comments",
        },
        {
          output: {
            comments: [
              {
                id: "1",
                text: "hello",
                createdAt: "2026-04-25T10:00:00Z",
                creator: { code: "user1", name: "User One" },
                mentions: [],
              },
            ],
            older: false,
            newer: true,
          },
          description: "single comment without mentions",
        },
        {
          output: {
            comments: [
              {
                id: "1",
                text: "hi @group1 @user2",
                createdAt: "2026-04-25T10:00:00Z",
                creator: { code: "user1", name: "User One" },
                mentions: [
                  { code: "group1", type: "GROUP" },
                  { code: "user2", type: "USER" },
                  { code: "org1", type: "ORGANIZATION" },
                ],
              },
            ],
            older: true,
            newer: false,
          },
          description: "comment with multiple mention types",
        },
      ])("accepts $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).not.toThrow();
      });
    });

    describe("output schema validation with invalid outputs", () => {
      it.each([
        { output: {}, description: "missing required fields" },
        {
          output: { comments: [], older: false },
          description: "missing newer",
        },
        {
          output: { comments: null, older: false, newer: false },
          description: "comments as null",
        },
        {
          output: { comments: [], older: "false", newer: false },
          description: "older as string",
        },
        {
          output: {
            comments: [
              {
                id: "1",
                text: "hi",
                createdAt: "2026-04-25T10:00:00Z",
                creator: { code: "u1", name: "n" },
                mentions: [{ code: "x", type: "ROLE" }],
              },
            ],
            older: false,
            newer: false,
          },
          description: "mention type with invalid value",
        },
        {
          output: {
            comments: [
              {
                id: 1,
                text: "hi",
                createdAt: "2026-04-25T10:00:00Z",
                creator: { code: "u1", name: "n" },
                mentions: [],
              },
            ],
            older: false,
            newer: false,
          },
          description: "comment id as number",
        },
      ])("rejects $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).toThrow();
      });
    });
  });

  describe("callback function", () => {
    it("should call API with required fields only and return formatted response", async () => {
      const mockResponse = {
        comments: [
          {
            id: "1",
            text: "first comment",
            createdAt: "2026-04-25T10:00:00Z",
            creator: { code: "user1", name: "User One" },
            mentions: [],
          },
        ],
        older: false,
        newer: false,
      };

      mockGetRecordComments.mockResolvedValueOnce(mockResponse);

      const input = { app: "123", record: "10" };

      const mockClient = createMockClient();
      mockClient.record.getRecordComments = mockGetRecordComments;

      const result = await getRecordComments.callback(input, {
        client: mockClient,
      });

      expect(mockGetRecordComments).toHaveBeenCalledWith({
        app: "123",
        record: "10",
        order: undefined,
        limit: undefined,
        offset: undefined,
      });
      expect(result.structuredContent).toEqual(mockResponse);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockResponse, null, 2),
      });
    });

    it("should call API with all parameters", async () => {
      const mockResponse = {
        comments: [
          {
            id: "5",
            text: "newest comment",
            createdAt: "2026-04-25T12:00:00Z",
            creator: { code: "user2", name: "User Two" },
            mentions: [{ code: "user1", type: "USER" }],
          },
        ],
        older: true,
        newer: false,
      };

      mockGetRecordComments.mockResolvedValueOnce(mockResponse);

      const input = {
        app: "456",
        record: "20",
        order: "desc" as const,
        limit: 5,
        offset: 10,
      };

      const mockClient = createMockClient();
      mockClient.record.getRecordComments = mockGetRecordComments;

      const result = await getRecordComments.callback(input, {
        client: mockClient,
      });

      expect(mockGetRecordComments).toHaveBeenCalledWith({
        app: "456",
        record: "20",
        order: "desc",
        limit: 5,
        offset: 10,
      });
      expect(result.structuredContent).toEqual(mockResponse);
    });

    it("should handle empty comments response", async () => {
      const mockResponse = {
        comments: [],
        older: false,
        newer: false,
      };

      mockGetRecordComments.mockResolvedValueOnce(mockResponse);

      const input = { app: "123", record: "10" };

      const mockClient = createMockClient();
      mockClient.record.getRecordComments = mockGetRecordComments;

      const result = await getRecordComments.callback(input, {
        client: mockClient,
      });

      expect(result.structuredContent).toEqual(mockResponse);
    });

    it("should handle API errors properly", async () => {
      const mockError = new Error("API Error: Record not found");
      mockGetRecordComments.mockRejectedValueOnce(mockError);

      const input = { app: "123", record: "999" };

      const mockClient = createMockClient();
      mockClient.record.getRecordComments = mockGetRecordComments;

      await expect(
        getRecordComments.callback(input, {
          client: mockClient,
        }),
      ).rejects.toThrow("API Error: Record not found");
    });
  });
});
