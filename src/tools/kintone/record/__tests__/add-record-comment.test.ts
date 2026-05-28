import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { addRecordComment } from "../add-record-comment.js";
import { z } from "zod";
import {
  createMockClient,
  mockKintoneConfig,
} from "../../../../__tests__/utils.js";

const mockAddRecordComment = vi.fn();

describe("add-record-comment tool", () => {
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
      expect(addRecordComment.name).toBe("kintone-add-record-comment");
    });

    it("should have correct description", () => {
      expect(addRecordComment.config.description).toBe(
        "Add a single comment to a kintone record. The kintone API accepts one comment per call; to add comments to multiple records, call this tool repeatedly.",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(addRecordComment.config.inputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        {
          input: { app: "1", record: "10", text: "hello" },
          description: "minimum required fields",
        },
        {
          input: {
            app: "1",
            record: "10",
            text: "hi @sato",
            mentions: [{ code: "sato", type: "USER" }],
          },
          description: "with single user mention",
        },
        {
          input: {
            app: "1",
            record: "10",
            text: "hi @sato @sales @hq",
            mentions: [
              { code: "sato", type: "USER" },
              { code: "sales", type: "GROUP" },
              { code: "hq", type: "ORGANIZATION" },
            ],
          },
          description: "with all mention types",
        },
        {
          input: { app: "1", record: "10", text: "hi", mentions: [] },
          description: "with empty mentions array",
        },
      ])("accepts $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).not.toThrow();
      });
    });

    describe("input schema validation with invalid inputs", () => {
      it.each([
        { input: {}, description: "missing all required fields" },
        {
          input: { app: "1", record: "10" },
          description: "missing text",
        },
        {
          input: { app: "1", text: "hi" },
          description: "missing record",
        },
        {
          input: { record: "10", text: "hi" },
          description: "missing app",
        },
        {
          input: { app: "1", record: "10", text: "" },
          description: "empty text",
        },
        {
          input: { app: 1, record: "10", text: "hi" },
          description: "app as number",
        },
        {
          input: { app: "1", record: 10, text: "hi" },
          description: "record as number",
        },
        {
          input: { app: "1", record: "10", text: 123 },
          description: "text as number",
        },
        {
          input: {
            app: "1",
            record: "10",
            text: "hi",
            mentions: [{ code: "sato", type: "ROLE" }],
          },
          description: "mention type with invalid value",
        },
        {
          input: {
            app: "1",
            record: "10",
            text: "hi",
            mentions: [{ code: "sato" }],
          },
          description: "mention without type",
        },
        {
          input: {
            app: "1",
            record: "10",
            text: "hi",
            mentions: [{ type: "USER" }],
          },
          description: "mention without code",
        },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputSchema = z.object(addRecordComment.config.outputSchema!);

    describe("output schema validation with valid outputs", () => {
      it.each([
        { output: { id: "1" }, description: "numeric string id" },
        { output: { id: "abc" }, description: "non-numeric id" },
      ])("accepts $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).not.toThrow();
      });
    });

    describe("output schema validation with invalid outputs", () => {
      it.each([
        { output: {}, description: "missing id" },
        { output: { id: 1 }, description: "id as number" },
        { output: { id: null }, description: "id as null" },
      ])("rejects $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).toThrow();
      });
    });
  });

  describe("callback function", () => {
    it("should call API with required fields only and return formatted response", async () => {
      const mockResponse = { id: "5" };
      mockAddRecordComment.mockResolvedValueOnce(mockResponse);

      const input = { app: "123", record: "10", text: "hello" };

      const mockClient = createMockClient();
      mockClient.record.addRecordComment = mockAddRecordComment;

      const result = await addRecordComment.callback(input, {
        client: mockClient,
      });

      expect(mockAddRecordComment).toHaveBeenCalledWith({
        app: "123",
        record: "10",
        comment: {
          text: "hello",
          mentions: undefined,
        },
      });
      expect(result.structuredContent).toEqual(mockResponse);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockResponse, null, 2),
      });
    });

    it("should call API with mentions", async () => {
      const mockResponse = { id: "7" };
      mockAddRecordComment.mockResolvedValueOnce(mockResponse);

      const input = {
        app: "456",
        record: "20",
        text: "hi @sato @sales",
        mentions: [
          { code: "sato", type: "USER" as const },
          { code: "sales", type: "GROUP" as const },
        ],
      };

      const mockClient = createMockClient();
      mockClient.record.addRecordComment = mockAddRecordComment;

      const result = await addRecordComment.callback(input, {
        client: mockClient,
      });

      expect(mockAddRecordComment).toHaveBeenCalledWith({
        app: "456",
        record: "20",
        comment: {
          text: "hi @sato @sales",
          mentions: [
            { code: "sato", type: "USER" },
            { code: "sales", type: "GROUP" },
          ],
        },
      });
      expect(result.structuredContent).toEqual(mockResponse);
    });

    it("should handle API errors properly", async () => {
      const mockError = new Error("API Error: Record not found");
      mockAddRecordComment.mockRejectedValueOnce(mockError);

      const input = { app: "123", record: "999", text: "hello" };

      const mockClient = createMockClient();
      mockClient.record.addRecordComment = mockAddRecordComment;

      await expect(
        addRecordComment.callback(input, {
          client: mockClient,
        }),
      ).rejects.toThrow("API Error: Record not found");
    });
  });
});
