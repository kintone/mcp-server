import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadFile } from "../download-file.js";
import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import { getFileTypeFromArrayBuffer } from "../../../../utils/file.js";
import path from "node:path";
import { mockExtra } from "../../../../__tests__/utils.js";

vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: vi.fn(),
}));

vi.mock("../../../../utils/file.js", () => ({
  ensureDirectoryExists: vi.fn(),
  getFileTypeFromArrayBuffer: vi.fn(),
  writeFileSyncFromArrayBuffer: vi.fn(),
}));

vi.mock("node:path");

describe("downloadFile", () => {
  const mockDownloadFile = vi.fn();
  const mockClient = {
    file: {
      downloadFile: mockDownloadFile,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock KintoneRestAPIClient
    vi.mocked(KintoneRestAPIClient).mockImplementation(() => mockClient as any);

    // Maintain actual behavior of path module
    vi.mocked(path.join).mockImplementation((...args) => args.join("/"));
  });

  describe("Success cases", () => {
    it("can successfully download and save a file", async () => {
      // Set environment variables
      process.env.KINTONE_BASE_URL = "https://example.cybozu.com";
      process.env.KINTONE_USERNAME = "testuser";
      process.env.KINTONE_PASSWORD = "testpass";
      process.env.KINTONE_ATTACHMENTS_DIR = "/tmp/downloads";

      // Set up mocks
      const mockBuffer = new ArrayBuffer(100);
      mockDownloadFile.mockResolvedValue(mockBuffer);

      vi.mocked(getFileTypeFromArrayBuffer).mockResolvedValue({
        mime: "image/png",
        ext: "png",
      });

      // Execute
      const result = await downloadFile.callback(
        { fileKey: "test-file-key-123" },
        mockExtra,
      );

      expect(result.structuredContent).toEqual({
        filePath: "/tmp/downloads/test-file-key-123.png",
        mimeType: "image/png",
        fileSize: 100,
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe(
        JSON.stringify(result.structuredContent, null, 2),
      );
    });

    it("can save a file even when extension cannot be determined", async () => {
      // Set environment variables
      process.env.KINTONE_BASE_URL = "https://example.cybozu.com";
      process.env.KINTONE_USERNAME = "testuser";
      process.env.KINTONE_PASSWORD = "testpass";
      process.env.KINTONE_ATTACHMENTS_DIR = "/tmp/downloads";

      // Set up mocks
      const mockBuffer = new ArrayBuffer(50);
      mockDownloadFile.mockResolvedValue(mockBuffer);

      vi.mocked(getFileTypeFromArrayBuffer).mockResolvedValue(null);

      // Execute
      const result = await downloadFile.callback(
        { fileKey: "no-ext-file" },
        mockExtra,
      );

      // Verify
      expect(result.structuredContent).toEqual({
        filePath: "/tmp/downloads/no-ext-file",
        mimeType: "application/octet-stream",
        fileSize: 50,
      });
    });
  });

  describe("Error cases", () => {
    it("throws error when KINTONE_ATTACHMENTS_DIR is not set", async () => {
      // Set environment variables (without ATTACHMENTS_DIR)
      process.env.KINTONE_BASE_URL = "https://example.cybozu.com";
      process.env.KINTONE_USERNAME = "testuser";
      process.env.KINTONE_PASSWORD = "testpass";
      delete process.env.KINTONE_ATTACHMENTS_DIR;

      // Execute and verify
      await expect(
        downloadFile.callback({ fileKey: "test-file" }, mockExtra),
      ).rejects.toThrow(
        "KINTONE_ATTACHMENTS_DIR environment variable must be set to use file download feature",
      );
    });

    it("throws error when download fails", async () => {
      // Set environment variables
      process.env.KINTONE_BASE_URL = "https://example.cybozu.com";
      process.env.KINTONE_USERNAME = "testuser";
      process.env.KINTONE_PASSWORD = "testpass";
      process.env.KINTONE_ATTACHMENTS_DIR = "/tmp/downloads";

      // Set up mocks
      mockDownloadFile.mockRejectedValue(new Error("Download failed"));

      // Execute and verify
      await expect(
        downloadFile.callback({ fileKey: "fail-file" }, mockExtra),
      ).rejects.toThrow("Download failed");
    });

    it("throws validation error for invalid fileKey", async () => {
      // Set environment variables
      process.env.KINTONE_BASE_URL = "https://example.cybozu.com";
      process.env.KINTONE_USERNAME = "testuser";
      process.env.KINTONE_PASSWORD = "testpass";
      process.env.KINTONE_ATTACHMENTS_DIR = "/tmp/downloads";

      // Execute and verify (when fileKey is a number)
      await expect(
        downloadFile.callback({ fileKey: 123 as any }, mockExtra),
      ).rejects.toThrow();
    });
  });

  describe("Tool metadata", () => {
    it("has correct tool name and description", () => {
      expect(downloadFile.name).toBe("kintone-download-file");
      expect(downloadFile.config.description).toContain(
        "Download a file from kintone",
      );
      expect(downloadFile.config.description).toContain(
        "KINTONE_ATTACHMENTS_DIR",
      );
    });

    it("has correct input schema", () => {
      const inputSchema = downloadFile.config.inputSchema;
      expect(inputSchema).toBeDefined();
      expect(inputSchema).toHaveProperty("fileKey");
    });

    it("has correct output schema", () => {
      const outputSchema = downloadFile.config.outputSchema;
      expect(outputSchema).toBeDefined();
      expect(outputSchema).toHaveProperty("filePath");
      expect(outputSchema).toHaveProperty("mimeType");
      expect(outputSchema).toHaveProperty("fileSize");
    });
  });
});
