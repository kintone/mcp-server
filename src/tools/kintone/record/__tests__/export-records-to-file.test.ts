import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import type * as NodeFs from "node:fs";
import { createMockClient } from "../../../../__tests__/utils.js";

vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof NodeFs>("node:fs");
  return {
    ...actual,
    default: {
      ...actual,
      writeFileSync: vi.fn(),
    },
    writeFileSync: vi.fn(),
  };
});

vi.mock("../../../../lib/filesystem.js", () => ({
  ensureDirectoryExists: vi.fn(),
}));

import fs from "node:fs";
import { exportRecordsToFile } from "../export-records-to-file.js";
import * as filesystem from "../../../../lib/filesystem.js";

const mockGetRecords = vi.fn();
const mockGetAllRecords = vi.fn();

describe("export-records-to-file tool", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      KINTONE_BASE_URL: "https://example.cybozu.com",
      KINTONE_USERNAME: "testuser",
      KINTONE_PASSWORD: "testpass",
      KINTONE_ATTACHMENTS_DIR: "/tmp/exports",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("tool configuration", () => {
    it("should have correct name", () => {
      expect(exportRecordsToFile.name).toBe("kintone-export-records-to-file");
    });

    it("should have title and description", () => {
      expect(exportRecordsToFile.config.title).toBe("Export Records to File");
      expect(exportRecordsToFile.config.description).toContain(
        "WITHOUT returning the record contents to the LLM",
      );
      expect(exportRecordsToFile.config.description).toContain(
        "KINTONE_ATTACHMENTS_DIR",
      );
      expect(exportRecordsToFile.config.description).toContain(
        "confirmLargeFetch",
      );
    });

    it("should accept valid inputs (input schema)", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(exportRecordsToFile.config.inputSchema!);
      expect(() => schema.parse({ app: "123" })).not.toThrow();
      expect(() =>
        schema.parse({
          app: "123",
          filters: { textContains: [{ field: "title", value: "x" }] },
          fields: ["title"],
          orderBy: [{ field: "created", order: "desc" }],
          limit: 100,
          offset: 0,
          confirmLargeFetch: true,
        }),
      ).not.toThrow();
    });

    it("should reject invalid inputs (input schema)", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(exportRecordsToFile.config.inputSchema!);
      expect(() => schema.parse({})).toThrow();
      expect(() => schema.parse({ app: 123 })).toThrow();
      expect(() => schema.parse({ app: "123", limit: 600 })).toThrow();
      expect(() => schema.parse({ app: "123", offset: -1 })).toThrow();
      expect(() =>
        schema.parse({ app: "123", confirmLargeFetch: "yes" }),
      ).toThrow();
    });

    it("should validate output schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(exportRecordsToFile.config.outputSchema!);
      expect(() =>
        schema.parse({
          filePath: "/tmp/exports/foo.json",
          app: "123",
          totalCount: "10",
          savedCount: 10,
          fileSize: 2048,
        }),
      ).not.toThrow();

      expect(() =>
        schema.parse({
          filePath: "/tmp/exports/foo.json",
          app: "123",
          totalCount: 10,
          savedCount: 10,
          fileSize: 2048,
        }),
      ).toThrow();
    });
  });

  describe("callback function", () => {
    it("should throw when KINTONE_ATTACHMENTS_DIR is not provided", async () => {
      const mockClient = createMockClient();
      mockClient.record.getRecords = mockGetRecords;
      mockClient.record.getAllRecords = mockGetAllRecords;

      await expect(
        exportRecordsToFile.callback(
          { app: "123" },
          { client: mockClient, attachmentsDir: undefined },
        ),
      ).rejects.toThrow(
        "KINTONE_ATTACHMENTS_DIR environment variable must be set",
      );
      expect(mockGetRecords).not.toHaveBeenCalled();
      expect(mockGetAllRecords).not.toHaveBeenCalled();
    });

    describe("limit specified mode (uses getRecords)", () => {
      it("should perform a single getRecords call with composed query", async () => {
        const records = [
          {
            $id: { type: "__ID__", value: "1" },
            title: { type: "SINGLE_LINE_TEXT", value: "A" },
          },
          {
            $id: { type: "__ID__", value: "2" },
            title: { type: "SINGLE_LINE_TEXT", value: "B" },
          },
        ];
        mockGetRecords.mockResolvedValueOnce({ records, totalCount: "2" });

        const mockClient = createMockClient();
        mockClient.record.getRecords = mockGetRecords;
        mockClient.record.getAllRecords = mockGetAllRecords;

        const result = await exportRecordsToFile.callback(
          {
            app: "123",
            filters: { textContains: [{ field: "title", value: "x" }] },
            orderBy: [{ field: "created", order: "desc" }],
            limit: 100,
            offset: 50,
          },
          { client: mockClient, attachmentsDir: "/tmp/exports" },
        );

        expect(mockGetRecords).toHaveBeenCalledTimes(1);
        expect(mockGetRecords).toHaveBeenCalledWith({
          app: "123",
          query: 'title like "x" order by created desc limit 100 offset 50',
          fields: undefined,
          totalCount: true,
        });
        expect(mockGetAllRecords).not.toHaveBeenCalled();

        expect(filesystem.ensureDirectoryExists).toHaveBeenCalledWith(
          "/tmp/exports",
        );
        expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
        const [writtenPath, writtenContent] = vi.mocked(fs.writeFileSync).mock
          .calls[0];
        expect(typeof writtenPath).toBe("string");
        expect(String(writtenPath)).toMatch(
          /^\/tmp\/exports\/kintone-records_app-123_\d{8}-\d{6}-\d{3}\.json$/,
        );
        expect(JSON.parse(String(writtenContent))).toEqual({
          records,
          totalCount: "2",
        });

        expect(result.structuredContent).toMatchObject({
          app: "123",
          totalCount: "2",
          savedCount: 2,
        });
        const sc = result.structuredContent as Record<string, unknown>;
        expect(sc.filePath).toBe(writtenPath);
        expect(sc.fileSize).toBe(Buffer.byteLength(String(writtenContent)));
        expect(result.content).toHaveLength(1);
        expect(result.content[0]).toEqual({
          type: "text",
          text: JSON.stringify(result.structuredContent, null, 2),
        });
      });

      it("should omit offset clause when offset is not specified", async () => {
        mockGetRecords.mockResolvedValueOnce({ records: [], totalCount: "0" });
        const mockClient = createMockClient();
        mockClient.record.getRecords = mockGetRecords;
        mockClient.record.getAllRecords = mockGetAllRecords;

        await exportRecordsToFile.callback(
          { app: "123", limit: 50 },
          { client: mockClient, attachmentsDir: "/tmp/exports" },
        );

        expect(mockGetRecords).toHaveBeenCalledWith({
          app: "123",
          query: "limit 50",
          fields: undefined,
          totalCount: true,
        });
      });

      it("should NOT include record contents in the LLM-facing text content", async () => {
        const sensitiveRecord = {
          $id: { type: "__ID__", value: "1" },
          secret: { type: "SINGLE_LINE_TEXT", value: "TOP_SECRET_VALUE_XYZ" },
        };
        mockGetRecords.mockResolvedValueOnce({
          records: [sensitiveRecord],
          totalCount: "1",
        });

        const mockClient = createMockClient();
        mockClient.record.getRecords = mockGetRecords;
        mockClient.record.getAllRecords = mockGetAllRecords;

        const result = await exportRecordsToFile.callback(
          { app: "123", limit: 1 },
          { client: mockClient, attachmentsDir: "/tmp/exports" },
        );

        expect(result.content[0]).toMatchObject({ type: "text" });
        const text = (result.content[0] as { text: string }).text;
        expect(text).not.toContain("TOP_SECRET_VALUE_XYZ");
        expect(text).not.toContain("secret");
      });
    });

    describe("full-export mode (uses getAllRecords)", () => {
      it("should probe totalCount with $id only and use getAllRecords when totalCount <= threshold", async () => {
        mockGetRecords.mockResolvedValueOnce({
          records: [{ $id: { type: "__ID__", value: "1" } }],
          totalCount: "250",
        });
        const fullRecords = Array.from({ length: 250 }, (_, i) => ({
          $id: { type: "__ID__", value: String(i + 1) },
        }));
        mockGetAllRecords.mockResolvedValueOnce(fullRecords);

        const mockClient = createMockClient();
        mockClient.record.getRecords = mockGetRecords;
        mockClient.record.getAllRecords = mockGetAllRecords;

        const result = await exportRecordsToFile.callback(
          {
            app: "123",
            filters: { equals: [{ field: "status", value: "approved" }] },
            orderBy: [{ field: "created", order: "asc" }],
            fields: ["title", "status"],
          },
          { client: mockClient, attachmentsDir: "/tmp/exports" },
        );

        // probe call
        expect(mockGetRecords).toHaveBeenCalledTimes(1);
        expect(mockGetRecords).toHaveBeenCalledWith({
          app: "123",
          query: 'status = "approved" order by created asc limit 1',
          fields: ["$id"],
          totalCount: true,
        });

        // getAllRecords call with separated condition and orderBy
        expect(mockGetAllRecords).toHaveBeenCalledTimes(1);
        expect(mockGetAllRecords).toHaveBeenCalledWith({
          app: "123",
          condition: 'status = "approved"',
          orderBy: "created asc",
          fields: ["title", "status", "$id"],
        });

        expect(result.structuredContent).toMatchObject({
          app: "123",
          totalCount: "250",
          savedCount: 250,
        });

        const writtenContent = vi.mocked(fs.writeFileSync).mock.calls[0][1];
        const parsed = JSON.parse(String(writtenContent));
        expect(parsed.records).toHaveLength(250);
        expect(parsed.totalCount).toBe("250");
      });

      it("should refuse to fetch when totalCount exceeds 500 without confirmLargeFetch", async () => {
        mockGetRecords.mockResolvedValueOnce({
          records: [{ $id: { type: "__ID__", value: "1" } }],
          totalCount: "1200",
        });

        const mockClient = createMockClient();
        mockClient.record.getRecords = mockGetRecords;
        mockClient.record.getAllRecords = mockGetAllRecords;

        await expect(
          exportRecordsToFile.callback(
            { app: "123" },
            { client: mockClient, attachmentsDir: "/tmp/exports" },
          ),
        ).rejects.toThrow(/1200.*exceeds the safety threshold of 500/);

        expect(mockGetAllRecords).not.toHaveBeenCalled();
        expect(fs.writeFileSync).not.toHaveBeenCalled();
      });

      it("should proceed when totalCount exceeds 500 and confirmLargeFetch is true", async () => {
        mockGetRecords.mockResolvedValueOnce({
          records: [{ $id: { type: "__ID__", value: "1" } }],
          totalCount: "1200",
        });
        const fullRecords = Array.from({ length: 1200 }, (_, i) => ({
          $id: { type: "__ID__", value: String(i + 1) },
        }));
        mockGetAllRecords.mockResolvedValueOnce(fullRecords);

        const mockClient = createMockClient();
        mockClient.record.getRecords = mockGetRecords;
        mockClient.record.getAllRecords = mockGetAllRecords;

        const result = await exportRecordsToFile.callback(
          { app: "123", confirmLargeFetch: true },
          { client: mockClient, attachmentsDir: "/tmp/exports" },
        );

        expect(mockGetAllRecords).toHaveBeenCalledWith({
          app: "123",
          condition: undefined,
          orderBy: undefined,
          fields: undefined,
        });
        expect(result.structuredContent).toMatchObject({
          totalCount: "1200",
          savedCount: 1200,
        });
      });

      it("should proceed normally at exactly the threshold (500 records)", async () => {
        mockGetRecords.mockResolvedValueOnce({
          records: [{ $id: { type: "__ID__", value: "1" } }],
          totalCount: "500",
        });
        const fullRecords = Array.from({ length: 500 }, (_, i) => ({
          $id: { type: "__ID__", value: String(i + 1) },
        }));
        mockGetAllRecords.mockResolvedValueOnce(fullRecords);

        const mockClient = createMockClient();
        mockClient.record.getRecords = mockGetRecords;
        mockClient.record.getAllRecords = mockGetAllRecords;

        const result = await exportRecordsToFile.callback(
          { app: "123" },
          { client: mockClient, attachmentsDir: "/tmp/exports" },
        );

        expect(mockGetAllRecords).toHaveBeenCalledTimes(1);
        expect(result.structuredContent).toMatchObject({
          totalCount: "500",
          savedCount: 500,
        });
      });

      it("should not request the record id twice when it is already selected", async () => {
        mockGetRecords.mockResolvedValueOnce({
          records: [],
          totalCount: "0",
        });
        mockGetAllRecords.mockResolvedValueOnce([]);

        const mockClient = createMockClient();
        mockClient.record.getRecords = mockGetRecords;
        mockClient.record.getAllRecords = mockGetAllRecords;

        await exportRecordsToFile.callback(
          { app: "123", fields: ["$id", "title"] },
          { client: mockClient, attachmentsDir: "/tmp/exports" },
        );

        expect(mockGetAllRecords).toHaveBeenCalledWith({
          app: "123",
          condition: undefined,
          orderBy: undefined,
          fields: ["$id", "title"],
        });
      });
    });
  });
});
