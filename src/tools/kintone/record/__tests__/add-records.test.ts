import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { addRecords } from "../add-records.js";
import { z } from "zod";
import {
  createMockClient,
  mockKintoneConfig,
} from "../../../../__tests__/utils.js";

// Mock function for addRecords API call
const mockAddRecords = vi.fn();

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
        "Add multiple records to a kintone app. Give each record as { fields: [ { fieldCode, value } ] } and leave out fields you do not set. Use kintone-get-form-fields tool first to discover available field codes and their required formats. Note: Some fields cannot be registered (LOOKUP copies, STATUS, CATEGORY, CALC, ASSIGNEE, auto-calculated fields, FILE).",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(addRecords.config.inputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        {
          input: {
            app: "123",
            records: [
              { fields: [{ fieldCode: "title", value: "Test Record" }] },
            ],
          },
          description: "single record with text field",
        },
        {
          input: {
            app: "123",
            records: [
              { fields: [{ fieldCode: "title", value: "Record 1" }] },
              { fields: [{ fieldCode: "number_field", value: "2" }] },
            ],
          },
          description: "multiple records with different fields",
        },
        {
          input: {
            app: "123",
            records: [
              {
                fields: [
                  { fieldCode: "date_field", value: "2025-01-01" },
                  { fieldCode: "time_field", value: "13:30" },
                  {
                    fieldCode: "datetime_field",
                    value: "2025-01-01T13:30:00Z",
                  },
                  { fieldCode: "number_field", value: "123.45" },
                  {
                    fieldCode: "checkbox_field",
                    value: ["option1", "option2"],
                  },
                  { fieldCode: "empty_checkbox_field", value: [] },
                  { fieldCode: "radio_field", value: "option1" },
                  { fieldCode: "link_field", value: "https://example.com" },
                  {
                    fieldCode: "user_field",
                    value: [{ code: "user1" }, { code: "user2" }],
                  },
                  { fieldCode: "creator_field", value: { code: "user001" } },
                ],
              },
            ],
          },
          description: "record with various field types",
        },
        {
          input: {
            app: "123",
            records: [
              {
                fields: [
                  {
                    fieldCode: "subtable_field",
                    value: [
                      {
                        id: "",
                        fields: [
                          { fieldCode: "sub_field_1", value: "sub value 1" },
                          { fieldCode: "sub_field_2", value: ["a"] },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          description: "record with subtable field",
        },
        {
          input: { app: "123", records: [{ fields: [] }] },
          description: "record with no field entries",
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
        { input: { app: 123 }, description: "app as number" },
        {
          input: { app: "123" },
          description: "missing required records field",
        },
        {
          input: { app: "123", records: null },
          description: "records as null",
        },
        {
          input: { app: "123", records: "not an array" },
          description: "records as string",
        },
        {
          input: { app: "123", records: [] },
          description: "empty records array",
        },
        {
          input: {
            app: "123",
            records: Array(101).fill({
              fields: [{ fieldCode: "title", value: "test" }],
            }),
          },
          description: "too many records (over 100)",
        },
        {
          input: { app: "123", records: [{}] },
          description: "record without fields",
        },
        {
          input: { app: "123", records: [{ title: { value: "Test" } }] },
          description: "record keyed by field code",
        },
        {
          input: {
            app: "123",
            records: [
              {
                fields: [
                  { fieldCode: "title", value: "A" },
                  { fieldCode: "title", value: "B" },
                ],
              },
            ],
          },
          description: "record with a duplicate field code",
        },
        {
          input: {
            app: "123",
            records: [{ fields: [{ fieldCode: "title", value: null }] }],
          },
          description: "record with a null value",
        },
        {
          input: {
            app: "123",
            records: [
              {
                fields: [
                  { fieldCode: "file_field", value: [{ fileKey: "file123" }] },
                ],
              },
            ],
          },
          description: "record with file field",
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
    it("should send records keyed by field code and return formatted response", async () => {
      const mockResponse = {
        ids: ["123", "124"],
        revisions: ["1", "1"],
      };

      mockAddRecords.mockResolvedValueOnce(mockResponse);

      const mockClient = createMockClient();
      mockClient.record.addRecords = mockAddRecords;

      const result = await addRecords.callback(
        {
          app: "456",
          records: [
            {
              fields: [
                { fieldCode: "title", value: "Record 1" },
                { fieldCode: "number_field", value: "100" },
              ],
            },
            {
              fields: [
                { fieldCode: "multi_select", value: ["option1", "option2"] },
              ],
            },
          ],
        },
        { client: mockClient },
      );

      expect(mockAddRecords).toHaveBeenCalledOnce();
      expect(mockAddRecords).toHaveBeenCalledWith({
        app: "456",
        records: [
          {
            title: { value: "Record 1" },
            number_field: { value: "100" },
          },
          {
            multi_select: { value: ["option1", "option2"] },
          },
        ],
      });
      expect(result.structuredContent).toEqual(mockResponse);
      expect(result.content).toEqual([
        {
          type: "text",
          text: JSON.stringify(mockResponse, null, 2),
        },
      ]);
    });

    it("should send subtable rows keyed by field code without empty row IDs", async () => {
      mockAddRecords.mockResolvedValueOnce({ ids: ["123"], revisions: ["1"] });

      const mockClient = createMockClient();
      mockClient.record.addRecords = mockAddRecords;

      await addRecords.callback(
        {
          app: "123",
          records: [
            {
              fields: [
                {
                  fieldCode: "user_field",
                  value: [{ code: "user1" }, { code: "user2" }],
                },
                {
                  fieldCode: "subtable_field",
                  value: [
                    {
                      id: "",
                      fields: [
                        { fieldCode: "sub_text", value: "sub value 1" },
                        { fieldCode: "sub_number", value: "10" },
                      ],
                    },
                    {
                      id: "",
                      fields: [{ fieldCode: "sub_text", value: "sub value 2" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        { client: mockClient },
      );

      expect(mockAddRecords).toHaveBeenCalledWith({
        app: "123",
        records: [
          {
            user_field: {
              value: [{ code: "user1" }, { code: "user2" }],
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
                  },
                },
              ],
            },
          },
        ],
      });
    });

    it("should handle API errors properly", async () => {
      const mockError = new Error("API Error: Invalid field value");
      mockAddRecords.mockRejectedValueOnce(mockError);

      const mockClient = createMockClient();
      mockClient.record.addRecords = mockAddRecords;

      await expect(
        addRecords.callback(
          {
            app: "123",
            records: [
              { fields: [{ fieldCode: "invalid_field", value: "test" }] },
            ],
          },
          { client: mockClient },
        ),
      ).rejects.toThrow("API Error: Invalid field value");
    });
  });
});
