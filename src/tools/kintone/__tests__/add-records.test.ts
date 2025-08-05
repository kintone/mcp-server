import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { addRecords } from "../add-records.js";
import { z } from "zod";
import { mockExtra, mockKintoneConfig } from "../../../__tests__/utils.js";

// Mock the KintoneRestAPIClient
const mockAddRecords = vi.fn();
vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: vi.fn().mockImplementation(() => ({
    record: {
      addRecords: mockAddRecords,
    },
  })),
}));

describe("add-records tool", () => {
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
      expect(addRecords.name).toBe("kintone-add-records");
    });

    it("should have correct description", () => {
      expect(addRecords.config.description).toBe(
        "Add multiple records to a kintone app. Use kintone-get-form-fields tool first to discover available field codes and their required formats. Note: Some fields cannot be registered (LOOKUP copies, STATUS, CATEGORY, CALC, ASSIGNEE, auto-calculated fields).",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(addRecords.config.inputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        {
          input: {
            app: 123,
            records: [
              {
                title: { value: "Test Record" },
              },
            ],
          },
          description: "single record with text field",
        },
        {
          input: {
            app: "123",
            records: [
              {
                title: { value: "Test Record" },
                number_field: { value: "100" },
              },
            ],
          },
          description: "app as string with text and number fields",
        },
        {
          input: {
            app: 123,
            records: [
              {
                title: { value: "Record 1" },
              },
              {
                title: { value: "Record 2" },
              },
            ],
          },
          description: "multiple records",
        },
        {
          input: {
            app: 123,
            records: [
              {
                multi_select: { value: ["option1", "option2"] },
              },
            ],
          },
          description: "record with array field",
        },
        {
          input: {
            app: 123,
            records: [
              {
                user_field: {
                  value: [{ code: "user1" }, { code: "user2" }],
                },
              },
            ],
          },
          description: "record with user select field",
        },
        {
          input: {
            app: 123,
            records: [
              {
                file_field: {
                  value: [{ fileKey: "file123" }],
                },
              },
            ],
          },
          description: "record with file field",
        },
        {
          input: {
            app: 123,
            records: [
              {
                subtable_field: {
                  value: [
                    {
                      id: "12345",
                      value: {
                        sub_field_1: { value: "sub value 1" },
                        sub_field_2: { value: "sub value 2" },
                      },
                    },
                  ],
                },
              },
            ],
          },
          description: "record with subtable field",
        },
        {
          input: {
            app: 123,
            records: [
              {
                date_field: { value: "2025-01-01" },
                time_field: { value: "13:30" },
                datetime_field: { value: "2025-01-01T13:30:00Z" },
                number_field: { value: "123.45" },
                checkbox_field: { value: ["option1", "option2"] },
                radio_field: { value: "option1" },
                dropdown_field: { value: "selected_option" },
                link_field: { value: "https://example.com" },
              },
            ],
          },
          description: "record with various field types",
        },
        {
          input: {
            app: 123,
            records: [
              {
                nullable_field: { value: null },
                empty_checkbox_field: { value: [] },
              },
            ],
          },
          description: "record with nullable and empty checkbox values",
        },
        {
          input: {
            app: 123,
            records: [
              {
                lookup_text_key: { value: "Code001" },
                lookup_number_key: { value: "10" },
              },
            ],
          },
          description: "record with lookup fields",
        },
        {
          input: {
            app: 123,
            records: [
              {
                creator_field: { value: { code: "user001" } },
                modifier_field: { value: { code: "user002" } },
                created_time_field: { value: "2025-01-01T09:00:00Z" },
                updated_time_field: { value: "2025-01-01T10:00:00Z" },
              },
            ],
          },
          description: "record with creator, modifier, and timestamp fields",
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
          input: { app: 123 },
          description: "missing required records field",
        },
        {
          input: { app: 123, records: null },
          description: "records as null",
        },
        {
          input: { app: 123, records: "not an array" },
          description: "records as string",
        },
        {
          input: { app: 123, records: [] },
          description: "empty records array",
        },
        {
          input: {
            app: 123,
            records: Array(101).fill({ title: { value: "test" } }),
          },
          description: "too many records (over 100)",
        },
        {
          input: {
            app: 123,
            records: [
              {
                field_with_invalid_structure: {
                  invalid_property: "should_fail",
                },
              },
            ],
          },
          description: "record with invalid field structure",
        },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputSchema = z.object(addRecords.config.outputSchema!);

    describe("output schema validation with valid outputs", () => {
      it.each([
        {
          output: {
            ids: ["1", "2"],
            revisions: ["1", "1"],
          },
          description: "basic output with multiple records",
        },
        {
          output: {
            ids: ["123"],
            revisions: ["1"],
          },
          description: "single record output",
        },
        {
          output: {
            ids: [],
            revisions: [],
          },
          description: "empty arrays (edge case)",
        },
      ])("accepts $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).not.toThrow();
      });
    });

    describe("output schema validation with invalid outputs", () => {
      it.each([
        {
          output: {},
          description: "missing required fields",
        },
        {
          output: { ids: null },
          description: "ids as null",
        },
        {
          output: { ids: ["1"], revisions: null },
          description: "revisions as null",
        },
        {
          output: { ids: "1", revisions: ["1"] },
          description: "ids as string",
        },
        {
          output: { ids: [1], revisions: ["1"] },
          description: "ids array containing number",
        },
        {
          output: { ids: ["1"], revisions: [1] },
          description: "revisions array containing number",
        },
      ])("rejects $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).toThrow();
      });
    });
  });

  describe("callback function", () => {
    it("should call API with single record and return formatted response", async () => {
      const mockResponse = {
        ids: ["123"],
        revisions: ["1"],
      };

      mockAddRecords.mockResolvedValueOnce(mockResponse);

      const input = {
        app: 123,
        records: [
          {
            title: { value: "Test Record" },
            description: { value: "Test Description" },
          },
        ],
      };

      const result = await addRecords.callback(input, mockExtra);

      expect(mockAddRecords).toHaveBeenCalledWith({
        app: 123,
        records: [
          {
            title: { value: "Test Record" },
            description: { value: "Test Description" },
          },
        ],
      });
      expect(result.structuredContent).toEqual(mockResponse);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockResponse, null, 2),
      });
    });

    it("should call API with multiple records", async () => {
      const mockResponse = {
        ids: ["123", "124", "125"],
        revisions: ["1", "1", "1"],
      };

      mockAddRecords.mockResolvedValueOnce(mockResponse);

      const input = {
        app: "456",
        records: [
          {
            title: { value: "Record 1" },
            number_field: { value: "100" },
          },
          {
            title: { value: "Record 2" },
            number_field: { value: "200" },
          },
          {
            title: { value: "Record 3" },
            multi_select: { value: ["option1", "option2"] },
          },
        ],
      };

      const result = await addRecords.callback(input, mockExtra);

      expect(mockAddRecords).toHaveBeenCalledWith({
        app: "456",
        records: [
          {
            title: { value: "Record 1" },
            number_field: { value: "100" },
          },
          {
            title: { value: "Record 2" },
            number_field: { value: "200" },
          },
          {
            title: { value: "Record 3" },
            multi_select: { value: ["option1", "option2"] },
          },
        ],
      });
      expect(result.structuredContent).toEqual(mockResponse);
    });

    it("should handle complex field types", async () => {
      const mockResponse = {
        ids: ["123"],
        revisions: ["1"],
      };

      mockAddRecords.mockResolvedValueOnce(mockResponse);

      const input = {
        app: 123,
        records: [
          {
            title: { value: "Complex Record" },
            user_field: {
              value: [{ code: "user1" }, { code: "user2" }],
            },
            file_field: {
              value: [{ fileKey: "file123" }, { fileKey: "file456" }],
            },
            subtable_field: {
              value: [
                {
                  value: {
                    sub_text: { value: "sub value 1" },
                    sub_number: { value: "10" },
                  },
                },
                {
                  value: {
                    sub_text: { value: "sub value 2" },
                    sub_number: { value: "20" },
                  },
                },
              ],
            },
          },
        ],
      };

      const result = await addRecords.callback(input, mockExtra);

      expect(mockAddRecords).toHaveBeenCalledWith({
        app: 123,
        records: [
          {
            title: { value: "Complex Record" },
            user_field: {
              value: [{ code: "user1" }, { code: "user2" }],
            },
            file_field: {
              value: [{ fileKey: "file123" }, { fileKey: "file456" }],
            },
            subtable_field: {
              value: [
                {
                  value: {
                    sub_text: { value: "sub value 1" },
                    sub_number: { value: "10" },
                  },
                },
                {
                  value: {
                    sub_text: { value: "sub value 2" },
                    sub_number: { value: "20" },
                  },
                },
              ],
            },
          },
        ],
      });
      expect(result.structuredContent).toEqual(mockResponse);
    });

    it("should handle API errors properly", async () => {
      const mockError = new Error("API Error: Invalid field value");
      mockAddRecords.mockRejectedValueOnce(mockError);

      const input = {
        app: 123,
        records: [
          {
            invalid_field: { value: "test" },
          },
        ],
      };

      await expect(addRecords.callback(input, mockExtra)).rejects.toThrow(
        "API Error: Invalid field value",
      );

      expect(mockAddRecords).toHaveBeenCalledWith({
        app: 123,
        records: [
          {
            invalid_field: { value: "test" },
          },
        ],
      });
    });
  });
});
