import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import type * as NodeFs from "node:fs";
import { createMockClient } from "../../../../__tests__/utils.js";

vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof NodeFs>("node:fs");
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: vi.fn(),
      readFileSync: vi.fn(),
    },
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

import fs from "node:fs";
import { updateRecordsFromFile } from "../update-records-from-file.js";

const mockUpdateRecords = vi.fn();
const mockGetFormFields = vi.fn();

const formProperties = {
  レコード番号: { type: "RECORD_NUMBER", code: "レコード番号" },
  title: { type: "SINGLE_LINE_TEXT", code: "title", expression: "" },
  price: { type: "NUMBER", code: "price" },
  total: { type: "CALC", code: "total" },
  user: { type: "USER_SELECT", code: "user" },
  attachment: { type: "FILE", code: "attachment" },
  customerCode: { type: "SINGLE_LINE_TEXT", code: "customerCode" },
  items: {
    type: "SUBTABLE",
    code: "items",
    fields: {
      itemName: { type: "SINGLE_LINE_TEXT", code: "itemName", expression: "" },
      itemTotal: { type: "CALC", code: "itemTotal" },
    },
  },
  created: { type: "CREATED_TIME", code: "created" },
};

const setFileContent = (content: unknown) => {
  vi.mocked(fs.existsSync).mockReturnValue(true);
  vi.mocked(fs.readFileSync).mockReturnValue(
    typeof content === "string" ? content : JSON.stringify(content),
  );
};

const createClient = () => {
  const client = createMockClient();
  client.record.updateRecords = mockUpdateRecords;
  client.app.getFormFields = mockGetFormFields;
  return client;
};

describe("update-records-from-file tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFormFields.mockResolvedValue({
      properties: formProperties,
      revision: "1",
    });
    mockUpdateRecords.mockImplementation(
      ({ records }: { records: unknown[] }) => ({
        records: records.map((_, index) => ({
          id: String(index + 1),
          revision: "2",
        })),
      }),
    );
  });

  describe("tool configuration", () => {
    it("should have correct name", () => {
      expect(updateRecordsFromFile.name).toBe(
        "kintone-update-records-from-file",
      );
    });

    it("should have title and description", () => {
      expect(updateRecordsFromFile.config.title).toBe(
        "Update Records from File",
      );
      expect(updateRecordsFromFile.config.description).toContain(
        "WITHOUT loading the record contents into the conversation",
      );
      expect(updateRecordsFromFile.config.description).toContain(
        "records that do not exist are never created",
      );
    });

    it("should accept valid inputs (input schema)", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(updateRecordsFromFile.config.inputSchema!);
      expect(() =>
        schema.parse({ app: "123", filePath: "/tmp/records.json" }),
      ).not.toThrow();
      expect(() =>
        schema.parse({
          app: "123",
          filePath: "records.json",
          offset: 0,
          limit: 100,
          dryRun: true,
        }),
      ).not.toThrow();
    });

    it("should reject invalid inputs (input schema)", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(updateRecordsFromFile.config.inputSchema!);
      expect(() => schema.parse({})).toThrow();
      expect(() => schema.parse({ app: "123" })).toThrow();
      expect(() => schema.parse({ app: 123, filePath: "a.json" })).toThrow();
      expect(() =>
        schema.parse({ app: "123", filePath: "a.json", offset: -1 }),
      ).toThrow();
      expect(() =>
        schema.parse({ app: "123", filePath: "a.json", limit: 0 }),
      ).toThrow();
    });

    it("should validate output schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(updateRecordsFromFile.config.outputSchema!);
      expect(() =>
        schema.parse({
          app: "123",
          filePath: "/tmp/records.json",
          totalRecordsInFile: 10,
          targetRecordCount: 10,
          updatedCount: 10,
          skippedFieldCodes: ["total"],
          dryRun: false,
        }),
      ).not.toThrow();

      expect(() =>
        schema.parse({
          app: "123",
          filePath: "/tmp/records.json",
          totalRecordsInFile: 10,
          targetRecordCount: 10,
          updatedCount: "10",
          skippedFieldCodes: [],
          dryRun: false,
        }),
      ).toThrow();
    });
  });

  describe("record identification", () => {
    it("should take the record id from $id and keep it out of the values", async () => {
      setFileContent({
        records: [
          {
            $id: { type: "__ID__", value: "42" },
            $revision: { type: "__REVISION__", value: "7" },
            レコード番号: { type: "RECORD_NUMBER", value: "42" },
            title: { type: "SINGLE_LINE_TEXT", value: "A" },
            total: { type: "CALC", value: "300" },
          },
        ],
        totalCount: "1",
      });

      const result = await updateRecordsFromFile.callback(
        { app: "123", filePath: "/tmp/records.json" },
        { client: createClient() },
      );

      expect(mockGetFormFields).toHaveBeenCalledWith({ app: "123" });
      expect(mockUpdateRecords).toHaveBeenCalledWith({
        app: "123",
        records: [
          { id: "42", record: { title: { value: "A" } }, revision: undefined },
        ],
        upsert: false,
      });
      expect(result.structuredContent).toMatchObject({
        totalRecordsInFile: 1,
        targetRecordCount: 1,
        updatedCount: 1,
        skippedFieldCodes: ["total", "レコード番号"],
        dryRun: false,
      });
    });

    it("should accept entries that carry the record id next to the values", async () => {
      setFileContent([
        { id: "10", record: { title: { value: "A" } } },
        { id: "11", record: { price: { value: 500 } } },
      ]);

      await updateRecordsFromFile.callback(
        { app: "123", filePath: "/tmp/records.json" },
        { client: createClient() },
      );

      expect(mockUpdateRecords).toHaveBeenCalledWith({
        app: "123",
        records: [
          { id: "10", record: { title: { value: "A" } }, revision: undefined },
          {
            id: "11",
            record: { price: { value: "500" } },
            revision: undefined,
          },
        ],
        upsert: false,
      });
    });

    it("should reject a record without a record id", async () => {
      setFileContent([{ title: { value: "A" } }]);

      await expect(
        updateRecordsFromFile.callback(
          { app: "123", filePath: "/tmp/records.json" },
          { client: createClient() },
        ),
      ).rejects.toThrow("no record id found");
      expect(mockUpdateRecords).not.toHaveBeenCalled();
      expect(mockGetFormFields).not.toHaveBeenCalled();
    });

    it("should accept a record id written as a JSON number", async () => {
      setFileContent([
        { id: 10, record: { title: { value: "A" } } },
        { $id: { value: 11 }, title: { value: "B" } },
      ]);

      await updateRecordsFromFile.callback(
        { app: "123", filePath: "/tmp/records.json" },
        { client: createClient() },
      );

      expect(mockUpdateRecords).toHaveBeenCalledWith({
        app: "123",
        records: [
          { id: "10", record: { title: { value: "A" } }, revision: undefined },
          { id: "11", record: { title: { value: "B" } }, revision: undefined },
        ],
        upsert: false,
      });
    });

    it("should reject an entry whose id is neither a string nor a number", async () => {
      setFileContent([{ id: true, record: { title: { value: "A" } } }]);

      await expect(
        updateRecordsFromFile.callback(
          { app: "123", filePath: "/tmp/records.json" },
          { client: createClient() },
        ),
      ).rejects.toThrow(
        "record #0: id must be a numeric value, written as a string or a number",
      );
      expect(mockUpdateRecords).not.toHaveBeenCalled();
    });
  });

  describe("revision handling", () => {
    it("should ignore the $revision an export carries along", async () => {
      setFileContent([
        {
          $id: { value: "1" },
          $revision: { value: "7" },
          title: { value: "A" },
        },
      ]);

      await updateRecordsFromFile.callback(
        { app: "123", filePath: "/tmp/records.json" },
        { client: createClient() },
      );

      expect(mockUpdateRecords).toHaveBeenCalledWith({
        app: "123",
        records: [
          { id: "1", record: { title: { value: "A" } }, revision: undefined },
        ],
        upsert: false,
      });
    });

    it("should send the revision stated on an entry", async () => {
      setFileContent([
        { id: "2", record: { title: { value: "B" } }, revision: "9" },
      ]);

      await updateRecordsFromFile.callback(
        { app: "123", filePath: "/tmp/records.json" },
        { client: createClient() },
      );

      expect(mockUpdateRecords).toHaveBeenCalledWith({
        app: "123",
        records: [
          { id: "2", record: { title: { value: "B" } }, revision: "9" },
        ],
        upsert: false,
      });
    });

    it("should accept a revision written as a JSON number", async () => {
      setFileContent([
        { id: "2", record: { title: { value: "B" } }, revision: 9 },
        { id: "3", record: { title: { value: "C" } }, revision: -1 },
      ]);

      await updateRecordsFromFile.callback(
        { app: "123", filePath: "/tmp/records.json" },
        { client: createClient() },
      );

      expect(mockUpdateRecords).toHaveBeenCalledWith({
        app: "123",
        records: [
          { id: "2", record: { title: { value: "B" } }, revision: "9" },
          { id: "3", record: { title: { value: "C" } }, revision: "-1" },
        ],
        upsert: false,
      });
    });
  });

  describe("normalization", () => {
    it("should keep table row ids so existing rows are updated", async () => {
      setFileContent([
        {
          $id: { value: "1" },
          items: {
            type: "SUBTABLE",
            value: [
              {
                id: "48290",
                value: {
                  itemName: { type: "SINGLE_LINE_TEXT", value: "pen" },
                  itemTotal: { type: "CALC", value: "100" },
                },
              },
              { value: { itemName: { value: "new row" } } },
            ],
          },
        },
      ]);

      const result = await updateRecordsFromFile.callback(
        { app: "123", filePath: "/tmp/records.json" },
        { client: createClient() },
      );

      expect(mockUpdateRecords.mock.calls[0][0].records[0].record).toEqual({
        items: {
          value: [
            { id: "48290", value: { itemName: { value: "pen" } } },
            { value: { itemName: { value: "new row" } } },
          ],
        },
      });
      expect(result.structuredContent).toMatchObject({
        skippedFieldCodes: ["itemTotal"],
      });
    });

    it("should accept a table row id written as a JSON number", async () => {
      setFileContent([
        {
          $id: { value: "1" },
          items: {
            type: "SUBTABLE",
            value: [{ id: 48290, value: { itemName: { value: "pen" } } }],
          },
        },
      ]);

      await updateRecordsFromFile.callback(
        { app: "123", filePath: "/tmp/records.json" },
        { client: createClient() },
      );

      expect(mockUpdateRecords.mock.calls[0][0].records[0].record).toEqual({
        items: {
          value: [{ id: "48290", value: { itemName: { value: "pen" } } }],
        },
      });
    });

    it("should reduce user selection values to codes and drop attachments read from records", async () => {
      setFileContent([
        {
          $id: { value: "1" },
          user: {
            type: "USER_SELECT",
            value: [{ code: "sato", name: "Noboru Sato" }],
          },
          attachment: {
            type: "FILE",
            value: [
              {
                contentType: "text/plain",
                fileKey: "download-key",
                name: "a.txt",
                size: "10",
              },
            ],
          },
          created: { type: "CREATED_TIME", value: "2024-01-01T00:00:00Z" },
        },
      ]);

      const result = await updateRecordsFromFile.callback(
        { app: "123", filePath: "/tmp/records.json" },
        { client: createClient() },
      );

      expect(mockUpdateRecords.mock.calls[0][0].records[0].record).toEqual({
        user: { value: [{ code: "sato" }] },
      });
      expect(result.structuredContent).toMatchObject({
        skippedFieldCodes: ["attachment", "created"],
      });
    });

    it("should reject values that do not match the field type in the app", async () => {
      setFileContent([{ $id: { value: "1" }, user: { value: "sato" } }]);

      await expect(
        updateRecordsFromFile.callback(
          { app: "123", filePath: "/tmp/records.json" },
          { client: createClient() },
        ),
      ).rejects.toThrow(
        'field "user" (USER_SELECT) must be an array of objects with a code property',
      );
      expect(mockUpdateRecords).not.toHaveBeenCalled();
    });
  });

  describe("file handling and batching", () => {
    it("should throw when the file does not exist", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await expect(
        updateRecordsFromFile.callback(
          { app: "123", filePath: "/tmp/missing.json" },
          { client: createClient() },
        ),
      ).rejects.toThrow("File not found: /tmp/missing.json");
    });

    it("should throw when the file is not valid JSON", async () => {
      setFileContent("{ broken");

      await expect(
        updateRecordsFromFile.callback(
          { app: "123", filePath: "/tmp/records.json" },
          { client: createClient() },
        ),
      ).rejects.toThrow("Failed to parse /tmp/records.json as JSON");
    });

    it("should update records in batches of 100", async () => {
      const records = Array.from({ length: 250 }, (_, index) => ({
        $id: { value: String(index + 1) },
        title: { value: `record-${index}` },
      }));
      setFileContent({ records });

      const result = await updateRecordsFromFile.callback(
        { app: "123", filePath: "/tmp/records.json" },
        { client: createClient() },
      );

      expect(mockUpdateRecords).toHaveBeenCalledTimes(3);
      expect(mockUpdateRecords.mock.calls[0][0].records).toHaveLength(100);
      expect(mockUpdateRecords.mock.calls[1][0].records).toHaveLength(100);
      expect(mockUpdateRecords.mock.calls[2][0].records).toHaveLength(50);
      expect(result.structuredContent).toMatchObject({
        totalRecordsInFile: 250,
        targetRecordCount: 250,
        updatedCount: 250,
      });
    });

    it("should honor offset and limit", async () => {
      const records = Array.from({ length: 10 }, (_, index) => ({
        $id: { value: String(index) },
        title: { value: `record-${index}` },
      }));
      setFileContent({ records });

      const result = await updateRecordsFromFile.callback(
        { app: "123", filePath: "/tmp/records.json", offset: 4, limit: 2 },
        { client: createClient() },
      );

      expect(mockUpdateRecords).toHaveBeenCalledWith({
        app: "123",
        records: [
          {
            id: "4",
            record: { title: { value: "record-4" } },
            revision: undefined,
          },
          {
            id: "5",
            record: { title: { value: "record-5" } },
            revision: undefined,
          },
        ],
        upsert: false,
      });
      expect(result.structuredContent).toMatchObject({
        totalRecordsInFile: 10,
        targetRecordCount: 2,
        updatedCount: 2,
      });
    });

    it("should reject a run that selects no record", async () => {
      setFileContent({ records: [{ $id: { value: "1" } }] });

      await expect(
        updateRecordsFromFile.callback(
          { app: "123", filePath: "/tmp/records.json", offset: 5 },
          { client: createClient() },
        ),
      ).rejects.toThrow(
        "No record was selected from /tmp/records.json: it holds 1 record(s), and offset 5 selects none.",
      );
      expect(mockGetFormFields).not.toHaveBeenCalled();
      expect(mockUpdateRecords).not.toHaveBeenCalled();
    });

    it("should reject an empty file", async () => {
      setFileContent([]);

      await expect(
        updateRecordsFromFile.callback(
          { app: "123", filePath: "/tmp/records.json" },
          { client: createClient() },
        ),
      ).rejects.toThrow("No record was selected");
      expect(mockUpdateRecords).not.toHaveBeenCalled();
    });

    it("should report the updated count and the resume offset when a batch fails", async () => {
      const records = Array.from({ length: 150 }, (_, index) => ({
        $id: { value: String(index + 1) },
        title: { value: `record-${index}` },
      }));
      setFileContent({ records });

      mockUpdateRecords
        .mockResolvedValueOnce({
          records: Array.from({ length: 100 }, (_, index) => ({
            id: String(index + 1),
            revision: "2",
          })),
        })
        .mockRejectedValueOnce(new Error("[520] invalid value"));

      await expect(
        updateRecordsFromFile.callback(
          { app: "123", filePath: "/tmp/records.json" },
          { client: createClient() },
        ),
      ).rejects.toThrow(
        /Failed to update the batch starting at record #100\..*100 record\(s\) were already updated.*resume with offset 100.*invalid value/s,
      );
    });
  });

  describe("dry run", () => {
    it("should validate against the app without updating records", async () => {
      setFileContent({
        records: [
          {
            $id: { value: "1" },
            title: { type: "SINGLE_LINE_TEXT", value: "A" },
            total: { type: "CALC", value: "1" },
          },
        ],
      });

      const result = await updateRecordsFromFile.callback(
        { app: "123", filePath: "/tmp/records.json", dryRun: true },
        { client: createClient() },
      );

      expect(mockGetFormFields).toHaveBeenCalledWith({ app: "123" });
      expect(mockUpdateRecords).not.toHaveBeenCalled();
      expect(result.structuredContent).toMatchObject({
        targetRecordCount: 1,
        updatedCount: 0,
        skippedFieldCodes: ["total"],
        dryRun: true,
      });
    });
  });

  describe("LLM-facing content", () => {
    it("should not include record contents in the returned text", async () => {
      setFileContent({
        records: [
          { $id: { value: "1" }, title: { value: "TOP_SECRET_VALUE_XYZ" } },
        ],
      });

      const result = await updateRecordsFromFile.callback(
        { app: "123", filePath: "/tmp/records.json" },
        { client: createClient() },
      );

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(result.structuredContent, null, 2),
      });
      const text = (result.content[0] as { text: string }).text;
      expect(text).not.toContain("TOP_SECRET_VALUE_XYZ");
    });
  });
});
