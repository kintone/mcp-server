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
import { importRecordsFromFile } from "../import-records-from-file.js";

const mockAddRecords = vi.fn();
const mockGetFormFields = vi.fn();

const formProperties = {
  レコード番号: { type: "RECORD_NUMBER", code: "レコード番号" },
  title: { type: "SINGLE_LINE_TEXT", code: "title", expression: "" },
  autoText: { type: "SINGLE_LINE_TEXT", code: "autoText", expression: "1+1" },
  price: { type: "NUMBER", code: "price" },
  total: { type: "CALC", code: "total" },
  user: { type: "USER_SELECT", code: "user" },
  attachment: { type: "FILE", code: "attachment" },
  customerCode: {
    type: "SINGLE_LINE_TEXT",
    code: "customerCode",
    lookup: {
      relatedApp: { app: "9", code: "" },
      relatedKeyField: "code",
      fieldMappings: [{ field: "customerName", relatedField: "name" }],
    },
  },
  customerName: { type: "SINGLE_LINE_TEXT", code: "customerName" },
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
  client.record.addRecords = mockAddRecords;
  client.app.getFormFields = mockGetFormFields;
  return client;
};

describe("import-records-from-file tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFormFields.mockResolvedValue({
      properties: formProperties,
      revision: "1",
    });
    mockAddRecords.mockImplementation(
      ({ records }: { records: unknown[] }) => ({
        ids: records.map((_, index) => String(index + 1)),
        revisions: records.map(() => "1"),
      }),
    );
  });

  describe("tool configuration", () => {
    it("should have correct name", () => {
      expect(importRecordsFromFile.name).toBe(
        "kintone-import-records-from-file",
      );
    });

    it("should have title and description", () => {
      expect(importRecordsFromFile.config.title).toBe(
        "Import Records from File",
      );
      expect(importRecordsFromFile.config.description).toContain(
        "WITHOUT loading the record contents into the conversation",
      );
      expect(importRecordsFromFile.config.description).toContain(
        "batches of 100",
      );
    });

    it("should accept valid inputs (input schema)", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(importRecordsFromFile.config.inputSchema!);
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
      const schema = z.object(importRecordsFromFile.config.inputSchema!);
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
      const schema = z.object(importRecordsFromFile.config.outputSchema!);
      expect(() =>
        schema.parse({
          app: "123",
          filePath: "/tmp/records.json",
          totalRecordsInFile: 10,
          targetRecordCount: 10,
          addedCount: 10,
          skippedFieldCodes: ["$id"],
          dryRun: false,
        }),
      ).not.toThrow();

      expect(() =>
        schema.parse({
          app: "123",
          filePath: "/tmp/records.json",
          totalRecordsInFile: "10",
          targetRecordCount: 10,
          addedCount: 10,
          skippedFieldCodes: [],
          dryRun: false,
        }),
      ).toThrow();
    });
  });

  describe("file handling", () => {
    it("should throw when the file does not exist", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await expect(
        importRecordsFromFile.callback(
          { app: "123", filePath: "/tmp/missing.json" },
          { client: createClient() },
        ),
      ).rejects.toThrow("File not found: /tmp/missing.json");
      expect(mockAddRecords).not.toHaveBeenCalled();
    });

    it("should throw when a relative path is given without KINTONE_ATTACHMENTS_DIR", async () => {
      await expect(
        importRecordsFromFile.callback(
          { app: "123", filePath: "records.json" },
          { client: createClient(), attachmentsDir: undefined },
        ),
      ).rejects.toThrow("filePath must be an absolute path");
    });

    it("should resolve a relative path against KINTONE_ATTACHMENTS_DIR", async () => {
      setFileContent({ records: [{ title: { value: "A" } }] });

      const result = await importRecordsFromFile.callback(
        { app: "123", filePath: "records.json" },
        { client: createClient(), attachmentsDir: "/tmp/exports" },
      );

      expect(fs.readFileSync).toHaveBeenCalledWith(
        "/tmp/exports/records.json",
        "utf-8",
      );
      expect(result.structuredContent).toMatchObject({
        filePath: "/tmp/exports/records.json",
      });
    });

    it("should throw when the file is not valid JSON", async () => {
      setFileContent("{ broken");

      await expect(
        importRecordsFromFile.callback(
          { app: "123", filePath: "/tmp/records.json" },
          { client: createClient() },
        ),
      ).rejects.toThrow("Failed to parse /tmp/records.json as JSON");
    });

    it("should throw when the JSON is neither an array nor a records object", async () => {
      setFileContent({ items: [] });

      await expect(
        importRecordsFromFile.callback(
          { app: "123", filePath: "/tmp/records.json" },
          { client: createClient() },
        ),
      ).rejects.toThrow("must contain a JSON array of records or an object");
    });

    it("should accept a plain JSON array of records", async () => {
      setFileContent([{ title: { value: "A" } }, { title: { value: "B" } }]);

      const result = await importRecordsFromFile.callback(
        { app: "123", filePath: "/tmp/records.json" },
        { client: createClient() },
      );

      expect(mockAddRecords).toHaveBeenCalledWith({
        app: "123",
        records: [{ title: { value: "A" } }, { title: { value: "B" } }],
      });
      expect(result.structuredContent).toMatchObject({
        totalRecordsInFile: 2,
        targetRecordCount: 2,
        addedCount: 2,
        dryRun: false,
      });
    });
  });

  describe("normalization", () => {
    it("should convert retrieval format to registration format and drop fields kintone rejects", async () => {
      setFileContent({
        records: [
          {
            $id: { type: "__ID__", value: "1" },
            $revision: { type: "__REVISION__", value: "3" },
            レコード番号: { type: "RECORD_NUMBER", value: "1" },
            title: { type: "SINGLE_LINE_TEXT", value: "A" },
            autoText: { type: "SINGLE_LINE_TEXT", value: "2" },
            total: { type: "CALC", value: "300" },
            created: { type: "CREATED_TIME", value: "2024-01-01T00:00:00Z" },
            customerCode: { type: "SINGLE_LINE_TEXT", value: "C-1" },
            customerName: { type: "SINGLE_LINE_TEXT", value: "Cybozu" },
            notInApp: { type: "SINGLE_LINE_TEXT", value: "x" },
          },
        ],
        totalCount: "1",
      });

      const result = await importRecordsFromFile.callback(
        { app: "123", filePath: "/tmp/records.json" },
        { client: createClient() },
      );

      expect(mockGetFormFields).toHaveBeenCalledWith({ app: "123" });
      expect(mockAddRecords).toHaveBeenCalledWith({
        app: "123",
        records: [{ title: { value: "A" }, customerCode: { value: "C-1" } }],
      });
      expect(result.structuredContent).toMatchObject({
        skippedFieldCodes: [
          "$id",
          "$revision",
          "autoText",
          "created",
          "customerName",
          "notInApp",
          "total",
          "レコード番号",
        ],
      });
    });

    it("should reduce user selection values to codes and stringify numbers", async () => {
      setFileContent([
        {
          user: {
            type: "USER_SELECT",
            value: [{ code: "sato", name: "Noboru Sato" }],
          },
          price: { value: 1200 },
        },
      ]);

      await importRecordsFromFile.callback(
        { app: "123", filePath: "/tmp/records.json" },
        { client: createClient() },
      );

      expect(mockAddRecords).toHaveBeenCalledWith({
        app: "123",
        records: [
          {
            user: { value: [{ code: "sato" }] },
            price: { value: "1200" },
          },
        ],
      });
    });

    it("should keep upload fileKeys but drop attachment values taken from record retrieval", async () => {
      setFileContent([
        { attachment: { value: [{ fileKey: "upload-key" }] } },
        {
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
        },
      ]);

      const result = await importRecordsFromFile.callback(
        { app: "123", filePath: "/tmp/records.json" },
        { client: createClient() },
      );

      expect(mockAddRecords).toHaveBeenCalledWith({
        app: "123",
        records: [{ attachment: { value: [{ fileKey: "upload-key" }] } }, {}],
      });
      expect(result.structuredContent).toMatchObject({
        skippedFieldCodes: ["attachment"],
      });
    });

    it("should add table rows as new rows and drop non-writable columns", async () => {
      setFileContent([
        {
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
            ],
          },
        },
      ]);

      const result = await importRecordsFromFile.callback(
        { app: "123", filePath: "/tmp/records.json" },
        { client: createClient() },
      );

      expect(mockAddRecords).toHaveBeenCalledWith({
        app: "123",
        records: [
          { items: { value: [{ value: { itemName: { value: "pen" } } }] } },
        ],
      });
      expect(result.structuredContent).toMatchObject({
        skippedFieldCodes: ["itemTotal"],
      });
    });
  });

  describe("validation", () => {
    it("should reject a file whose records are not kintone record objects without adding anything", async () => {
      setFileContent([{ title: { value: "A" } }, { title: "B" }]);

      await expect(
        importRecordsFromFile.callback(
          { app: "123", filePath: "/tmp/records.json" },
          { client: createClient() },
        ),
      ).rejects.toThrow("No record was added");
      expect(mockGetFormFields).not.toHaveBeenCalled();
      expect(mockAddRecords).not.toHaveBeenCalled();
    });

    it("should reject values that do not match the field type in the app", async () => {
      setFileContent([{ user: { value: "sato" } }]);

      await expect(
        importRecordsFromFile.callback(
          { app: "123", filePath: "/tmp/records.json" },
          { client: createClient() },
        ),
      ).rejects.toThrow(
        'field "user" (USER_SELECT) must be an array of objects with a code property',
      );
      expect(mockAddRecords).not.toHaveBeenCalled();
    });
  });

  describe("batching", () => {
    it("should add records in batches of 100", async () => {
      const records = Array.from({ length: 250 }, (_, index) => ({
        title: { value: `record-${index}` },
      }));
      setFileContent({ records });

      const result = await importRecordsFromFile.callback(
        { app: "123", filePath: "/tmp/records.json" },
        { client: createClient() },
      );

      expect(mockAddRecords).toHaveBeenCalledTimes(3);
      expect(mockAddRecords.mock.calls[0][0].records).toHaveLength(100);
      expect(mockAddRecords.mock.calls[1][0].records).toHaveLength(100);
      expect(mockAddRecords.mock.calls[2][0].records).toHaveLength(50);
      expect(result.structuredContent).toMatchObject({
        totalRecordsInFile: 250,
        targetRecordCount: 250,
        addedCount: 250,
      });
    });

    it("should honor offset and limit", async () => {
      const records = Array.from({ length: 10 }, (_, index) => ({
        title: { value: `record-${index}` },
      }));
      setFileContent({ records });

      const result = await importRecordsFromFile.callback(
        { app: "123", filePath: "/tmp/records.json", offset: 4, limit: 3 },
        { client: createClient() },
      );

      expect(mockAddRecords).toHaveBeenCalledWith({
        app: "123",
        records: [
          { title: { value: "record-4" } },
          { title: { value: "record-5" } },
          { title: { value: "record-6" } },
        ],
      });
      expect(result.structuredContent).toMatchObject({
        totalRecordsInFile: 10,
        targetRecordCount: 3,
        addedCount: 3,
      });
    });

    it("should reject a run that selects no record", async () => {
      setFileContent({ records: [{ title: { value: "A" } }] });

      await expect(
        importRecordsFromFile.callback(
          { app: "123", filePath: "/tmp/records.json", offset: 5 },
          { client: createClient() },
        ),
      ).rejects.toThrow(
        "No record was selected from /tmp/records.json: it holds 1 record(s), and offset 5 selects none.",
      );
      expect(mockGetFormFields).not.toHaveBeenCalled();
      expect(mockAddRecords).not.toHaveBeenCalled();
    });

    it("should reject an empty file", async () => {
      setFileContent([]);

      await expect(
        importRecordsFromFile.callback(
          { app: "123", filePath: "/tmp/records.json" },
          { client: createClient() },
        ),
      ).rejects.toThrow("No record was selected");
      expect(mockAddRecords).not.toHaveBeenCalled();
    });

    it("should report the added count and the resume offset when a batch fails", async () => {
      const records = Array.from({ length: 150 }, (_, index) => ({
        title: { value: `record-${index}` },
      }));
      setFileContent({ records });

      mockAddRecords
        .mockResolvedValueOnce({
          ids: Array.from({ length: 100 }, (_, index) => String(index)),
          revisions: [],
        })
        .mockRejectedValueOnce(new Error("[520] invalid value"));

      await expect(
        importRecordsFromFile.callback(
          { app: "123", filePath: "/tmp/records.json" },
          { client: createClient() },
        ),
      ).rejects.toThrow(
        /Failed to add the batch starting at record #100\..*100 record\(s\) were already added.*resume with offset 100.*invalid value/s,
      );
    });
  });

  describe("dry run", () => {
    it("should validate against the app without adding records", async () => {
      setFileContent({
        records: [
          {
            title: { type: "SINGLE_LINE_TEXT", value: "A" },
            total: { type: "CALC", value: "1" },
          },
        ],
      });

      const result = await importRecordsFromFile.callback(
        { app: "123", filePath: "/tmp/records.json", dryRun: true },
        { client: createClient() },
      );

      expect(mockGetFormFields).toHaveBeenCalledWith({ app: "123" });
      expect(mockAddRecords).not.toHaveBeenCalled();
      expect(result.structuredContent).toMatchObject({
        targetRecordCount: 1,
        addedCount: 0,
        skippedFieldCodes: ["total"],
        dryRun: true,
      });
    });
  });

  describe("LLM-facing content", () => {
    it("should not include record contents in the returned text", async () => {
      setFileContent({
        records: [{ title: { value: "TOP_SECRET_VALUE_XYZ" } }],
      });

      const result = await importRecordsFromFile.callback(
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
