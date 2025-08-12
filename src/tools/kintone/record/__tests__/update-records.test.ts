import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { updateRecords } from "../update-records.js";
import { z } from "zod";
import { mockExtra, mockKintoneConfig } from "../../../../__tests__/utils.js";

// Mock the KintoneRestAPIClient
const mockUpdateRecords = vi.fn();
vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: vi.fn().mockImplementation(() => ({
    record: {
      updateRecords: mockUpdateRecords,
    },
  })),
}));

describe("update-records tool", () => {
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
      expect(updateRecords.name).toBe("kintone-update-records");
    });

    it("should have correct description", () => {
      expect(updateRecords.config.description).toBe(
        "Update multiple records in a kintone app. Use kintone-get-form-fields tool first to discover available field codes and their required formats. Note: Some fields cannot be updated (LOOKUP copies, STATUS, CATEGORY, CALC, ASSIGNEE, auto-calculated fields).",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(updateRecords.config.inputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        {
          input: {
            app: 123,
            records: [
              {
                id: "1",
                record: {
                  title: { value: "Updated Record" },
                },
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
                id: "1",
                record: {
                  title: { value: "Updated Record" },
                  number_field: { value: "100" },
                },
                revision: "2",
              },
            ],
          },
          description: "app as string with revision",
        },
        {
          input: {
            app: 123,
            records: [
              {
                id: "1",
                record: {
                  title: { value: "Record 1" },
                },
              },
              {
                id: "2",
                record: {
                  title: { value: "Record 2" },
                },
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
                id: "1",
                record: {
                  multi_select: { value: ["option1", "option2"] },
                },
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
                id: "1",
                record: {
                  user_field: {
                    value: [{ code: "user1" }, { code: "user2" }],
                  },
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
                id: "1",
                record: {
                  file_field: {
                    value: [{ fileKey: "file123" }],
                  },
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
                id: "1",
                record: {
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
                id: "1",
                record: {
                  date_field: { value: "2025-01-01" },
                  time_field: { value: "13:30" },
                  datetime_field: { value: "2025-01-01T13:30:00Z" },
                  number_field: { value: "123.45" },
                  checkbox_field: { value: ["option1", "option2"] },
                  radio_field: { value: "option1" },
                  dropdown_field: { value: "selected_option" },
                  link_field: { value: "https://example.com" },
                },
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
                id: "1",
                record: {
                  nullable_field: { value: null },
                  empty_checkbox_field: { value: [] },
                },
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
                id: "1",
                record: {
                  lookup_text_key: { value: "Code001" },
                  lookup_number_key: { value: "10" },
                },
              },
            ],
          },
          description: "record with lookup fields",
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
            records: Array(101).fill({
              id: "1",
              record: { title: { value: "test" } },
            }),
          },
          description: "too many records (over 100)",
        },
        {
          input: {
            app: 123,
            records: [
              {
                record: { title: { value: "test" } },
              },
            ],
          },
          description: "missing required id field",
        },
        {
          input: {
            app: 123,
            records: [
              {
                id: 123,
                record: { title: { value: "test" } },
              },
            ],
          },
          description: "id as number instead of string",
        },
        {
          input: {
            app: 123,
            records: [
              {
                id: "1",
              },
            ],
          },
          description: "missing required record field",
        },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputSchema = z.object(updateRecords.config.outputSchema!);

    describe("output schema validation with valid outputs", () => {
      it.each([
        {
          output: {
            records: [
              { id: "1", revision: "2" },
              { id: "2", revision: "1" },
            ],
          },
          description: "basic output with multiple records",
        },
        {
          output: {
            records: [{ id: "123", revision: "5" }],
          },
          description: "single record output",
        },
        {
          output: {
            records: [],
          },
          description: "empty records array (edge case)",
        },
      ])("accepts $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).not.toThrow();
      });
    });

    describe("output schema validation with invalid outputs", () => {
      it.each([
        {
          output: {},
          description: "missing required records field",
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
          output: { records: [{ id: 1, revision: "2" }] },
          description: "id as number",
        },
        {
          output: { records: [{ id: "1", revision: 2 }] },
          description: "revision as number",
        },
        {
          output: { records: [{ id: "1" }] },
          description: "missing revision field",
        },
      ])("rejects $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).toThrow();
      });
    });
  });

  describe("callback function", () => {
    it("should call API with single record and return formatted response", async () => {
      const mockResponse = {
        records: [{ id: "123", revision: "2" }],
      };

      mockUpdateRecords.mockResolvedValueOnce(mockResponse);

      const input = {
        app: 123,
        records: [
          {
            id: "123",
            record: {
              title: { value: "Updated Record" },
              description: { value: "Updated Description" },
            },
          },
        ],
      };

      const result = await updateRecords.callback(input, mockExtra);

      expect(mockUpdateRecords).toHaveBeenCalledWith({
        app: 123,
        records: [
          {
            id: "123",
            record: {
              title: { value: "Updated Record" },
              description: { value: "Updated Description" },
            },
          },
        ],
        upsert: false,
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
        records: [
          { id: "123", revision: "3" },
          { id: "124", revision: "2" },
          { id: "125", revision: "1" },
        ],
      };

      mockUpdateRecords.mockResolvedValueOnce(mockResponse);

      const input = {
        app: "456",
        records: [
          {
            id: "123",
            record: {
              title: { value: "Updated Record 1" },
              number_field: { value: "100" },
            },
            revision: "2",
          },
          {
            id: "124",
            record: {
              title: { value: "Updated Record 2" },
              number_field: { value: "200" },
            },
          },
          {
            id: "125",
            record: {
              title: { value: "Updated Record 3" },
              multi_select: { value: ["option1", "option2"] },
            },
          },
        ],
      };

      const result = await updateRecords.callback(input, mockExtra);

      expect(mockUpdateRecords).toHaveBeenCalledWith({
        app: "456",
        records: [
          {
            id: "123",
            record: {
              title: { value: "Updated Record 1" },
              number_field: { value: "100" },
            },
            revision: "2",
          },
          {
            id: "124",
            record: {
              title: { value: "Updated Record 2" },
              number_field: { value: "200" },
            },
          },
          {
            id: "125",
            record: {
              title: { value: "Updated Record 3" },
              multi_select: { value: ["option1", "option2"] },
            },
          },
        ],
        upsert: false,
      });
      expect(result.structuredContent).toEqual(mockResponse);
    });

    it("should handle complex field types", async () => {
      const mockResponse = {
        records: [{ id: "123", revision: "2" }],
      };

      mockUpdateRecords.mockResolvedValueOnce(mockResponse);

      const input = {
        app: 123,
        records: [
          {
            id: "123",
            record: {
              title: { value: "Complex Updated Record" },
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
                      sub_text: { value: "updated sub value 1" },
                      sub_number: { value: "15" },
                    },
                  },
                  {
                    value: {
                      sub_text: { value: "updated sub value 2" },
                      sub_number: { value: "25" },
                    },
                  },
                ],
              },
            },
          },
        ],
      };

      const result = await updateRecords.callback(input, mockExtra);

      expect(mockUpdateRecords).toHaveBeenCalledWith({
        app: 123,
        records: [
          {
            id: "123",
            record: {
              title: { value: "Complex Updated Record" },
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
                      sub_text: { value: "updated sub value 1" },
                      sub_number: { value: "15" },
                    },
                  },
                  {
                    value: {
                      sub_text: { value: "updated sub value 2" },
                      sub_number: { value: "25" },
                    },
                  },
                ],
              },
            },
          },
        ],
        upsert: false,
      });
      expect(result.structuredContent).toEqual(mockResponse);
    });

    it("should always set upsert to false", async () => {
      const mockResponse = {
        records: [{ id: "123", revision: "2" }],
      };

      mockUpdateRecords.mockResolvedValueOnce(mockResponse);

      const input = {
        app: 123,
        records: [
          {
            id: "123",
            record: {
              title: { value: "Test Record" },
            },
          },
        ],
      };

      await updateRecords.callback(input, mockExtra);

      expect(mockUpdateRecords).toHaveBeenCalledWith({
        app: 123,
        records: [
          {
            id: "123",
            record: {
              title: { value: "Test Record" },
            },
          },
        ],
        upsert: false,
      });
    });

    it("should handle API errors properly", async () => {
      const mockError = new Error("API Error: Record not found");
      mockUpdateRecords.mockRejectedValueOnce(mockError);

      const input = {
        app: 123,
        records: [
          {
            id: "999",
            record: {
              title: { value: "test" },
            },
          },
        ],
      };

      await expect(updateRecords.callback(input, mockExtra)).rejects.toThrow(
        "API Error: Record not found",
      );

      expect(mockUpdateRecords).toHaveBeenCalledWith({
        app: 123,
        records: [
          {
            id: "999",
            record: {
              title: { value: "test" },
            },
          },
        ],
        upsert: false,
      });
    });
  });
});
