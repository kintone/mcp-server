import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { updateRecords } from "../update-records.js";
import { z } from "zod";
import {
  createMockClient,
  mockToolCallbackOptions,
  mockKintoneConfig,
} from "../../../../__tests__/utils.js";

// Mock function for updateRecords API call
const mockUpdateRecords = vi.fn();

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
        'Update multiple records in a kintone app. Use kintone-get-form-fields tool first to discover available field codes and their required formats. To update a SUBTABLE field, pass every row to keep: existing rows with their row ID from kintone-get-records, and new rows with "" as the ID. Rows left out are deleted. Note: Some fields cannot be updated (LOOKUP copies, STATUS, CATEGORY, CALC, ASSIGNEE, FILE, auto-calculated fields).',
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(updateRecords.config.inputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        {
          input: {
            app: "123",
            records: [
              {
                id: "1",
                revision: "-1",
                fields: [{ fieldCode: "title", value: "Updated Record" }],
              },
            ],
          },
          description: "single record skipping revision validation",
        },
        {
          input: {
            app: "123",
            records: [
              {
                id: "1",
                revision: "2",
                fields: [
                  { fieldCode: "title", value: "Updated Record" },
                  { fieldCode: "number_field", value: "100" },
                ],
              },
            ],
          },
          description: "record with revision",
        },
        {
          input: {
            app: "123",
            records: [
              {
                id: "1",
                revision: "-1",
                fields: [{ fieldCode: "title", value: "Record 1" }],
              },
              {
                id: "2",
                revision: "5",
                fields: [{ fieldCode: "status_text", value: "Done" }],
              },
            ],
          },
          description: "multiple records with different fields",
        },
        {
          input: {
            app: "123",
            records: [
              {
                id: "1",
                revision: "-1",
                fields: [
                  {
                    fieldCode: "user_field",
                    value: [{ code: "user1" }, { code: "user2" }],
                  },
                  { fieldCode: "creator_field", value: { code: "user1" } },
                ],
              },
            ],
          },
          description: "record with user fields",
        },
        {
          input: {
            app: "123",
            records: [
              {
                id: "1",
                revision: "-1",
                fields: [
                  {
                    fieldCode: "subtable_field",
                    value: [
                      {
                        id: "12345",
                        fields: [
                          { fieldCode: "sub_field_1", value: "sub value 1" },
                        ],
                      },
                      {
                        id: "",
                        fields: [
                          { fieldCode: "sub_field_1", value: "new row" },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          description: "record with existing and new subtable rows",
        },
        {
          input: {
            app: "123",
            records: [
              {
                id: "1",
                revision: "-1",
                fields: [
                  { fieldCode: "text_field", value: "" },
                  { fieldCode: "empty_checkbox_field", value: [] },
                ],
              },
            ],
          },
          description: "record with empty text and empty checkbox values",
        },
      ])("accepts $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).not.toThrow();
      });
    });

    describe("input schema validation with invalid inputs", () => {
      it.each([
        { input: {}, description: "missing required app field" },
        { input: { app: 123 }, description: "app as number" },
        {
          input: { app: "123" },
          description: "missing required records field",
        },
        {
          input: { app: "123", records: [] },
          description: "empty records array",
        },
        {
          input: {
            app: "123",
            records: Array(101).fill({
              id: "1",
              revision: "-1",
              fields: [{ fieldCode: "title", value: "test" }],
            }),
          },
          description: "too many records (over 100)",
        },
        {
          input: {
            app: "123",
            records: [
              {
                revision: "-1",
                fields: [{ fieldCode: "title", value: "test" }],
              },
            ],
          },
          description: "missing required id field",
        },
        {
          input: {
            app: "123",
            records: [{ id: "1", revision: "-1" }],
          },
          description: "missing required fields field",
        },
        {
          input: {
            app: "123",
            records: [
              {
                id: "1",
                record: { title: { value: "test" } },
              },
            ],
          },
          description: '"record" key instead of "fields"',
        },
        {
          input: {
            app: "123",
            records: [
              {
                id: "1",
                revision: "-1",
                fields: [
                  { fieldCode: "title", value: "a" },
                  { fieldCode: "title", value: "b" },
                ],
              },
            ],
          },
          description: "duplicate field codes",
        },
        {
          input: {
            app: "123",
            records: [
              {
                id: "1",
                revision: "-1",
                fields: [
                  { fieldCode: "file_field", value: [{ fileKey: "file123" }] },
                ],
              },
            ],
          },
          description: "FILE field value",
        },
        {
          input: {
            app: "123",
            records: [
              {
                id: "1",
                revision: "-1",
                fields: [
                  {
                    fieldCode: "subtable_field",
                    value: [
                      { fields: [{ fieldCode: "sub_field_1", value: "x" }] },
                    ],
                  },
                ],
              },
            ],
          },
          description: "subtable row without id",
        },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    describe("revision validation", () => {
      const parseRevision = (record: object) =>
        inputSchema.safeParse({
          app: "123",
          records: [
            {
              id: "1",
              fields: [{ fieldCode: "title", value: "x" }],
              ...record,
            },
          ],
        });

      it.each(["-1", "0", "12"])("accepts %j", (revision) => {
        expect(parseRevision({ revision }).success).toBe(true);
      });

      it("tells how to skip revision validation when revision is missing", () => {
        const result = parseRevision({});

        expect(result.error?.issues).toEqual([
          expect.objectContaining({
            path: ["records", 0, "revision"],
            message:
              'revision is required. Specify "-1" to skip revision validation',
          }),
        ]);
      });

      it.each(["", "abc", "-2", "1.5", " 1"])(
        "rejects %j with how to write a revision",
        (revision) => {
          const result = parseRevision({ revision });

          expect(result.error?.issues).toEqual([
            expect.objectContaining({
              path: ["records", 0, "revision"],
              message:
                'revision must be "-1" or a revision number such as "3". Specify "-1" to skip revision validation',
            }),
          ]);
        },
      );
    });

    describe("fields validation", () => {
      it("rejects empty fields", () => {
        const result = inputSchema.safeParse({
          app: "123",
          records: [{ id: "1", revision: "-1", fields: [] }],
        });

        expect(result.error?.issues).toContainEqual(
          expect.objectContaining({
            path: ["records", 0, "fields"],
            message: "fields must contain at least one field to update",
          }),
        );
      });
    });

    describe("advertised input schema", () => {
      // tools/list renders the input side of the schema.
      const advertised = z.toJSONSchema(inputSchema, { io: "input" });
      const recordItem = z
        .looseObject({
          properties: z.object({
            revision: z.record(z.string(), z.unknown()),
            fields: z.record(z.string(), z.unknown()),
          }),
        })
        .parse(
          z.object({ items: z.unknown() }).parse(advertised.properties?.records)
            .items,
        );

      it("does not advertise the revision pattern", () => {
        expect(recordItem.properties.revision).not.toHaveProperty("pattern");
      });

      it("does not advertise a minimum number of fields", () => {
        expect(recordItem.properties.fields).not.toHaveProperty("minItems");
      });

      it("does not advertise required keys of records", () => {
        expect(recordItem).not.toHaveProperty("required");
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
          output: { records: [{ id: 1, revision: "2" }] },
          description: "id as number",
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
    it("should convert fields into a record and return formatted response", async () => {
      const mockResponse = {
        records: [{ id: "123", revision: "2" }],
      };

      mockUpdateRecords.mockResolvedValueOnce(mockResponse);

      const mockClient = createMockClient();
      mockClient.record.updateRecords = mockUpdateRecords;

      const result = await updateRecords.callback(
        {
          app: "123",
          records: [
            {
              id: "123",
              revision: "1",
              fields: [
                { fieldCode: "title", value: "Updated Record" },
                { fieldCode: "description", value: "Updated Description" },
              ],
            },
          ],
        },
        mockToolCallbackOptions(mockClient),
      );

      expect(mockUpdateRecords).toHaveBeenCalledWith({
        app: "123",
        records: [
          {
            id: "123",
            revision: "1",
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

    it('should pass revision "-1" to the API as is', async () => {
      mockUpdateRecords.mockResolvedValueOnce({
        records: [
          { id: "123", revision: "3" },
          { id: "124", revision: "2" },
        ],
      });

      const mockClient = createMockClient();
      mockClient.record.updateRecords = mockUpdateRecords;

      await updateRecords.callback(
        {
          app: "456",
          records: [
            {
              id: "123",
              revision: "2",
              fields: [{ fieldCode: "number_field", value: "100" }],
            },
            {
              id: "124",
              revision: "-1",
              fields: [{ fieldCode: "multi_select", value: ["option1"] }],
            },
          ],
        },
        mockToolCallbackOptions(mockClient),
      );

      expect(mockUpdateRecords).toHaveBeenCalledWith({
        app: "456",
        records: [
          {
            id: "123",
            revision: "2",
            record: { number_field: { value: "100" } },
          },
          {
            id: "124",
            revision: "-1",
            record: { multi_select: { value: ["option1"] } },
          },
        ],
        upsert: false,
      });
    });

    it('should keep subtable row IDs and drop "" for new rows', async () => {
      mockUpdateRecords.mockResolvedValueOnce({
        records: [{ id: "123", revision: "2" }],
      });

      const mockClient = createMockClient();
      mockClient.record.updateRecords = mockUpdateRecords;

      await updateRecords.callback(
        {
          app: "123",
          records: [
            {
              id: "123",
              revision: "-1",
              fields: [
                {
                  fieldCode: "subtable_field",
                  value: [
                    {
                      id: "10",
                      fields: [{ fieldCode: "sub_text", value: "kept row" }],
                    },
                    {
                      id: "",
                      fields: [{ fieldCode: "sub_text", value: "new row" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        mockToolCallbackOptions(mockClient),
      );

      expect(mockUpdateRecords).toHaveBeenCalledWith({
        app: "123",
        records: [
          {
            id: "123",
            revision: "-1",
            record: {
              subtable_field: {
                value: [
                  { id: "10", value: { sub_text: { value: "kept row" } } },
                  { value: { sub_text: { value: "new row" } } },
                ],
              },
            },
          },
        ],
        upsert: false,
      });
    });

    it("should handle API errors properly", async () => {
      const mockError = new Error("API Error: Record not found");
      mockUpdateRecords.mockRejectedValueOnce(mockError);

      const mockClient = createMockClient();
      mockClient.record.updateRecords = mockUpdateRecords;

      await expect(
        updateRecords.callback(
          {
            app: "123",
            records: [
              {
                id: "999",
                revision: "-1",
                fields: [{ fieldCode: "title", value: "test" }],
              },
            ],
          },
          mockToolCallbackOptions(mockClient),
        ),
      ).rejects.toThrow("API Error: Record not found");
    });
  });
});
