import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getRecords } from "../get-records.js";
import { z } from "zod";
import { mockExtra, mockKintoneConfig } from "../../../__tests__/utils.js";

// Mock the KintoneRestAPIClient
const mockGetRecords = vi.fn();
vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: vi.fn().mockImplementation(() => ({
    record: {
      getRecords: mockGetRecords,
    },
  })),
}));

describe("get-records tool", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
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
      expect(getRecords.name).toBe("kintone-get-records");
    });

    it("should have correct description", () => {
      expect(getRecords.config.description).toBe(
        "Get multiple records from a kintone app with structured filtering. Use kintone-get-form-fields tool first to discover available fields and their types.",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(getRecords.config.inputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        { input: { app: 123 }, description: "app as number only" },
        { input: { app: "123" }, description: "app as string" },
        {
          input: {
            app: 123,
            filters: {
              textContains: [{ field: "title", value: "meeting" }],
            },
          },
          description: "with textContains filter",
        },
        {
          input: {
            app: 123,
            filters: {
              equals: [
                { field: "status", value: "approved" },
                { field: "count", value: 10 },
              ],
            },
          },
          description: "with equals filter for string and number",
        },
        {
          input: {
            app: 123,
            filters: {
              dateRange: [
                { field: "created", from: "2025-01-01", to: "2025-12-31" },
              ],
            },
          },
          description: "with dateRange filter",
        },
        {
          input: {
            app: 123,
            filters: {
              numberRange: [
                { field: "price", min: 100, max: 1000 },
                { field: "stock", min: 0 },
              ],
            },
          },
          description: "with numberRange filter",
        },
        {
          input: {
            app: 123,
            filters: {
              inValues: [{ field: "status", values: ["pending", "approved"] }],
            },
          },
          description: "with inValues filter",
        },
        {
          input: {
            app: 123,
            filters: {
              notInValues: [
                { field: "status", values: ["rejected", "cancelled"] },
              ],
            },
          },
          description: "with notInValues filter",
        },
        {
          input: {
            app: 123,
            filters: {
              textContains: [{ field: "title", value: "meeting" }],
              equals: [{ field: "creator", value: "user@example.com" }],
              dateRange: [{ field: "created", from: "2025-01-01" }],
            },
          },
          description: "with multiple filter types",
        },
        {
          input: {
            app: 123,
            fields: ["title", "status", "created"],
          },
          description: "with fields array",
        },
        {
          input: {
            app: 123,
            orderBy: [{ field: "created", order: "desc" }, { field: "title" }],
          },
          description: "with orderBy",
        },
        {
          input: {
            app: 123,
            limit: 100,
            offset: 50,
            totalCount: true,
          },
          description: "with pagination and totalCount",
        },
      ])("accepts $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).not.toThrow();
      });
    });

    describe("input schema validation with invalid inputs", () => {
      it.each([
        { input: {}, description: "missing required app field" },
        { input: { app: true }, description: "app as boolean" },
        { input: { app: null }, description: "app as null" },
        { input: { app: [] }, description: "app as array" },
        {
          input: {
            app: 123,
            filters: {
              textContains: [{ field: "title" }],
            },
          },
          description: "textContains missing value",
        },
        {
          input: {
            app: 123,
            filters: {
              equals: [{ value: "test" }],
            },
          },
          description: "equals missing field",
        },
        {
          input: {
            app: 123,
            filters: {
              numberRange: [{ field: "price", min: "100" }],
            },
          },
          description: "numberRange with string value",
        },
        {
          input: {
            app: 123,
            filters: {
              inValues: [{ field: "status", values: "pending" }],
            },
          },
          description: "inValues with non-array value",
        },
        {
          input: {
            app: 123,
            orderBy: [{ field: "created", order: "invalid" }],
          },
          description: "invalid order value",
        },
        {
          input: {
            app: 123,
            limit: 600,
          },
          description: "limit exceeds maximum",
        },
        {
          input: {
            app: 123,
            limit: 0,
          },
          description: "limit below minimum",
        },
        {
          input: {
            app: 123,
            offset: -1,
          },
          description: "negative offset",
        },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputSchema = z.object(getRecords.config.outputSchema!);

    describe("output schema validation with valid outputs", () => {
      it.each([
        {
          output: {
            records: [
              {
                field_1: { type: "SINGLE_LINE_TEXT", value: "test" },
                $id: { type: "__ID__", value: "1" },
              },
            ],
          },
          description: "basic records array",
        },
        {
          output: {
            records: [],
          },
          description: "empty records array",
        },
        {
          output: {
            records: [
              {
                text_field: { type: "SINGLE_LINE_TEXT", value: "test" },
                number_field: { type: "NUMBER", value: "100" },
                date_field: { type: "DATE", value: "2025-01-01" },
                select_field: { type: "DROP_DOWN", value: "option1" },
                checkbox_field: { type: "CHECK_BOX", value: ["opt1", "opt2"] },
              },
            ],
            totalCount: "150",
          },
          description: "records with various field types and totalCount",
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
          output: { records: null },
          description: "records as null",
        },
        {
          output: { records: "not an array" },
          description: "records as string",
        },
        {
          output: {
            records: [{ field_1: "invalid structure" }],
          },
          description: "invalid record field structure",
        },
        {
          output: {
            records: [],
            totalCount: 150,
          },
          description: "totalCount as number instead of string",
        },
      ])("rejects $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).toThrow();
      });
    });
  });

  describe("callback function", () => {
    it("should call API with simple filters and return formatted response", async () => {
      const mockData = {
        records: [
          {
            title: { type: "SINGLE_LINE_TEXT", value: "Test Record" },
            $id: { type: "__ID__", value: "1" },
          },
        ],
      };

      mockGetRecords.mockResolvedValueOnce(mockData);

      const result = await getRecords.callback(
        {
          app: 123,
          filters: {
            textContains: [{ field: "title", value: "Test" }],
          },
        },
        mockExtra,
      );

      expect(mockGetRecords).toHaveBeenCalledWith({
        app: 123,
        query: 'title like "Test"',
        fields: undefined,
        totalCount: true,
      });
      expect(result.structuredContent).toEqual(mockData);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockData, null, 2),
      });
    });

    it("should build complex query with multiple filters", async () => {
      const mockData = { records: [] };
      mockGetRecords.mockResolvedValueOnce(mockData);

      await getRecords.callback(
        {
          app: 123,
          filters: {
            textContains: [{ field: "title", value: "meeting" }],
            equals: [
              { field: "status", value: "approved" },
              { field: "priority", value: 1 },
            ],
            dateRange: [
              { field: "created", from: "2025-01-01", to: "2025-12-31" },
            ],
            numberRange: [{ field: "price", min: 100, max: 1000 }],
            inValues: [{ field: "category", values: ["A", "B", "C"] }],
            notInValues: [{ field: "type", values: ["X", "Y"] }],
          },
          orderBy: [{ field: "created", order: "desc" }, { field: "title" }],
          limit: 50,
          offset: 100,
        },
        mockExtra,
      );

      expect(mockGetRecords).toHaveBeenCalledWith({
        app: 123,
        query:
          'title like "meeting" and status = "approved" and priority = 1 and created >= "2025-01-01" and created <= "2025-12-31" and price >= 100 and price <= 1000 and category in ("A", "B", "C") and type not in ("X", "Y") order by created desc, title asc limit 50 offset 100',
        fields: undefined,
        totalCount: true,
      });
    });

    it("should handle empty filters", async () => {
      const mockData = { records: [] };
      mockGetRecords.mockResolvedValueOnce(mockData);

      await getRecords.callback(
        {
          app: 123,
          filters: {},
        },
        mockExtra,
      );

      expect(mockGetRecords).toHaveBeenCalledWith({
        app: 123,
        query: undefined,
        fields: undefined,
        totalCount: true,
      });
    });

    it("should handle orderBy without filters", async () => {
      const mockData = { records: [] };
      mockGetRecords.mockResolvedValueOnce(mockData);

      await getRecords.callback(
        {
          app: 123,
          orderBy: [{ field: "created", order: "desc" }],
        },
        mockExtra,
      );

      expect(mockGetRecords).toHaveBeenCalledWith({
        app: 123,
        query: "order by created desc",
        fields: undefined,
        totalCount: true,
      });
    });

    it("should always include totalCount", async () => {
      const mockData = {
        records: [],
        totalCount: "42",
      };
      mockGetRecords.mockResolvedValueOnce(mockData);

      const result = await getRecords.callback(
        {
          app: 123,
        },
        mockExtra,
      );

      expect(mockGetRecords).toHaveBeenCalledWith({
        app: 123,
        query: undefined,
        fields: undefined,
        totalCount: true,
      });
      expect(result.structuredContent).toEqual({
        records: [],
        totalCount: "42",
      });
    });
  });
});
