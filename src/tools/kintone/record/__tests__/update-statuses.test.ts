import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { updateStatuses } from "../update-statuses.js";
import { z } from "zod";
import {
  createMockClient,
  mockToolCallbackOptions,
  mockKintoneConfig,
} from "../../../../__tests__/utils.js";

// Mock function for updateRecordsStatus API call
const mockUpdateRecordsStatus = vi.fn();

describe("update-statuses tool", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables for testing
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
      expect(updateStatuses.name).toBe("kintone-update-statuses");
    });

    it("should have correct description", () => {
      expect(updateStatuses.config.description).toBe(
        "Update status of multiple records in a kintone app. Requires process management feature to be enabled. Maximum 100 records can be updated at once.",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(updateStatuses.config.inputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        {
          input: {
            app: "123",
            records: [{ id: "1", action: "申請する" }],
          },
          description: "basic record with app as string",
        },
        {
          input: {
            app: "123",
            records: [
              {
                id: "1",
                action: "申請する",
                assignee: "user1",
                revision: "1",
              },
            ],
          },
          description: "record with all optional fields",
        },
        {
          input: {
            app: "123",
            records: Array.from({ length: 100 }, (_, i) => ({
              id: String(i + 1),
              action: "申請する",
            })),
          },
          description: "maximum 100 records",
        },
        {
          input: {
            app: "123",
            records: [
              { id: "1", action: "申請する" },
              { id: "2", action: "承認", assignee: "user2" },
            ],
          },
          description: "multiple records with different actions",
        },
        {
          input: {
            app: "123",
            records: [{ id: "123", action: "申請する" }],
          },
          description: "record id as number",
        },
        {
          input: {
            app: "123",
            records: [{ id: "1", action: "申請する", revision: "1" }],
          },
          description: "revision as string",
        },
      ])("accepts $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).not.toThrow();
      });
    });

    describe("input schema validation with invalid inputs", () => {
      it.each([
        {
          input: {},
          description: "missing all required fields",
        },
        { input: { app: 123 }, description: "app as number" },
        {
          input: { app: "123" },
          description: "missing records field",
        },
        {
          input: { records: [{ id: "1", action: "申請する" }] },
          description: "missing app field",
        },
        {
          input: { app: true, records: [{ id: "1", action: "申請する" }] },
          description: "app as boolean",
        },
        {
          input: { app: null, records: [{ id: "1", action: "申請する" }] },
          description: "app as null",
        },
        {
          input: { app: [], records: [{ id: "1", action: "申請する" }] },
          description: "app as array",
        },
        {
          input: { app: "123", records: [] },
          description: "empty records array",
        },
        {
          input: {
            app: "123",
            records: Array.from({ length: 101 }, (_, i) => ({
              id: String(i + 1),
              action: "申請する",
            })),
          },
          description: "more than 100 records",
        },
        {
          input: { app: "123", records: [{ action: "申請する" }] },
          description: "record missing id field",
        },
        {
          input: { app: "123", records: [{ id: "1" }] },
          description: "record missing action field",
        },
        {
          input: {
            app: "123",
            records: [{ id: "1", action: 123 }],
          },
          description: "record action as number",
        },
        {
          input: {
            app: "123",
            records: [{ id: "1", action: "申請する", assignee: 123 }],
          },
          description: "assignee as number",
        },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputSchema = z.object(updateStatuses.config.outputSchema!);

    describe("output schema validation with valid outputs", () => {
      it.each([
        {
          output: {
            records: [
              {
                id: "1",
                revision: "2",
              },
            ],
          },
          description: "single updated record",
        },
        {
          output: {
            records: [
              { id: "1", revision: "2" },
              { id: "2", revision: "3" },
            ],
          },
          description: "multiple updated records",
        },
        {
          output: {
            records: [],
          },
          description: "empty records array",
        },
      ])("accepts $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).not.toThrow();
      });
    });

    describe("output schema validation with invalid outputs", () => {
      it.each([
        {
          output: {},
          description: "missing records field",
        },
        {
          output: {
            records: [
              {
                revision: "2",
              },
            ],
          },
          description: "record missing id field",
        },
        {
          output: {
            records: [
              {
                id: "1",
              },
            ],
          },
          description: "record missing revision field",
        },
        {
          output: {
            records: [
              {
                id: 1,
                revision: "2",
              },
            ],
          },
          description: "record id as number",
        },
        {
          output: {
            records: [
              {
                id: "1",
                revision: 2,
              },
            ],
          },
          description: "record revision as number",
        },
      ])("rejects $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).toThrow();
      });
    });
  });

  describe("callback function", () => {
    it("should call API and return formatted response for single record", async () => {
      const mockData = {
        records: [
          {
            id: "1",
            revision: "2",
          },
        ],
      };

      mockUpdateRecordsStatus.mockResolvedValueOnce(mockData);

      const input = {
        app: "123",
        records: [
          {
            id: "1",
            action: "申請する",
            assignee: "user1",
            revision: "1",
          },
        ],
      };

      const mockClient = createMockClient();
      mockClient.record.updateRecordsStatus = mockUpdateRecordsStatus;

      const result = await updateStatuses.callback(
        input,
        mockToolCallbackOptions(mockClient),
      );

      expect(mockUpdateRecordsStatus).toHaveBeenCalledWith({
        app: "123",
        records: [
          {
            id: "1",
            action: "申請する",
            assignee: "user1",
            revision: "1",
          },
        ],
      });
      expect(result.structuredContent).toEqual(mockData);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockData, null, 2),
      });
    });

    it("should call API and return formatted response for multiple records", async () => {
      const mockData = {
        records: [
          { id: "1", revision: "2" },
          { id: "2", revision: "3" },
        ],
      };

      mockUpdateRecordsStatus.mockResolvedValueOnce(mockData);

      const input = {
        app: "456",
        records: [
          { id: "1", action: "申請する" },
          { id: "2", action: "承認", assignee: "user2" },
        ],
      };

      const mockClient = createMockClient();
      mockClient.record.updateRecordsStatus = mockUpdateRecordsStatus;

      const result = await updateStatuses.callback(
        input,
        mockToolCallbackOptions(mockClient),
      );

      expect(mockUpdateRecordsStatus).toHaveBeenCalledWith({
        app: "456",
        records: [
          { id: "1", action: "申請する" },
          { id: "2", action: "承認", assignee: "user2" },
        ],
      });
      expect(result.structuredContent).toEqual(mockData);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockData, null, 2),
      });
    });

    it("should handle API errors", async () => {
      const error = new Error("API Error");
      mockUpdateRecordsStatus.mockRejectedValueOnce(error);

      const input = {
        app: "123",
        records: [{ id: "1", action: "申請する" }],
      };

      const mockClient = createMockClient();
      mockClient.record.updateRecordsStatus = mockUpdateRecordsStatus;

      await expect(
        updateStatuses.callback(input, {
          client: mockClient,
        }),
      ).rejects.toThrow("API Error");
    });
  });
});
