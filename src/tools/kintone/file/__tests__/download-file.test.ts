import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { createMockClient } from "../../../../__tests__/utils.js";

vi.mock("../../../../lib/filesystem.js", () => ({
  ensureDirectoryExists: vi.fn(),
  generateFileName: vi.fn(),
  generateFilePath: vi.fn(),
  getFileTypeFromArrayBuffer: vi.fn(),
  writeFileSyncWithoutOverwrite: vi.fn(),
}));

import { downloadFile } from "../download-file.js";
import * as filesystem from "../../../../lib/filesystem.js";

// Mock function for downloadFile API call
const mockDownloadFile = vi.fn();

describe("download-file tool", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Set up environment variables for testing
    process.env = {
      ...originalEnv,
      KINTONE_BASE_URL: "https://example.cybozu.com",
      KINTONE_USERNAME: "testuser",
      KINTONE_PASSWORD: "testpass",
      KINTONE_ATTACHMENTS_DIR: "/tmp/downloads",
    };

    // Set up default mock implementations
    vi.mocked(filesystem.generateFileName).mockImplementation(
      (fileName, ext) => (ext ? `${fileName}.${ext}` : fileName),
    );
    vi.mocked(filesystem.generateFilePath).mockImplementation(
      (dir, filename) => `${dir}/${filename}`,
    );
    vi.mocked(filesystem.getFileTypeFromArrayBuffer).mockResolvedValue(
      undefined,
    );
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("tool configuration", () => {
    it("should have correct name", () => {
      expect(downloadFile.name).toBe("kintone-download-file");
    });

    it("should have correct description", () => {
      expect(downloadFile.config.description).toBe(
        "Download a file from kintone using its fileKey and save it to the configured download directory. Returns the absolute path to the saved file. Requires KINTONE_ATTACHMENTS_DIR environment variable to be set, app record viewing permission, and permission to view the field containing the file.",
      );
    });

    it("should have valid input schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(downloadFile.config.inputSchema!);

      // Valid input
      const validInput = {
        fileKey: "test-file-key-123",
        fileName: "test-file.png",
      };
      expect(() => schema.parse(validInput)).not.toThrow();

      // Invalid input - missing fields
      expect(() => schema.parse({})).toThrow();
      expect(() => schema.parse({ fileKey: "key" })).toThrow();

      // Invalid input - wrong types
      expect(() =>
        schema.parse({
          fileKey: 123, // should be string
          fileName: "test",
        }),
      ).toThrow();
    });

    it("should have valid output schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(downloadFile.config.outputSchema!);

      // Valid output
      const validOutput = {
        filePath: "/tmp/downloads/test-file.png",
        mimeType: "image/png",
        fileSize: 1024,
      };
      expect(() => schema.parse(validOutput)).not.toThrow();

      // Invalid output - missing required fields
      expect(() => schema.parse({ filePath: "/path" })).toThrow();
      expect(() =>
        schema.parse({ ...validOutput, fileSize: "1024" }),
      ).toThrow(); // wrong type for fileSize
    });
  });

  describe("callback function", () => {
    it("should download file successfully", async () => {
      const mockBuffer = new ArrayBuffer(100);
      mockDownloadFile.mockResolvedValueOnce(mockBuffer);
      vi.mocked(filesystem.getFileTypeFromArrayBuffer).mockResolvedValueOnce({
        mime: "image/png",
        ext: "png",
      });

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(downloadFile.config.inputSchema!);
      const params = schema.parse({
        fileKey: "test-file-key-123",
        fileName: "test-file.png",
      });

      const mockClient = createMockClient();
      mockClient.file.downloadFile = mockDownloadFile;

      const result = await downloadFile.callback(params, {
        client: mockClient,
        attachmentsDir: "/tmp/downloads",
      });

      expect(mockDownloadFile).toHaveBeenCalledWith({
        fileKey: "test-file-key-123",
      });

      expect(result.structuredContent).toEqual({
        filePath: "/tmp/downloads/test-file.png.png",
        mimeType: "image/png",
        fileSize: 100,
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(result.structuredContent, null, 2),
      });
    });

    it("should handle file without extension", async () => {
      const mockBuffer = new ArrayBuffer(50);
      mockDownloadFile.mockResolvedValueOnce(mockBuffer);
      vi.mocked(filesystem.getFileTypeFromArrayBuffer).mockResolvedValueOnce(
        undefined,
      );

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(downloadFile.config.inputSchema!);
      const params = schema.parse({
        fileKey: "no-ext-file",
        fileName: "no-ext-file",
      });

      const mockClient = createMockClient();
      mockClient.file.downloadFile = mockDownloadFile;

      const result = await downloadFile.callback(params, {
        client: mockClient,
        attachmentsDir: "/tmp/downloads",
      });

      expect(result.structuredContent).toEqual({
        filePath: "/tmp/downloads/no-ext-file",
        mimeType: "application/octet-stream",
        fileSize: 50,
      });
    });

    it("should throw error when attachmentsDir is not provided", async () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(downloadFile.config.inputSchema!);
      const params = schema.parse({
        fileKey: "test-file",
        fileName: "test-file",
      });

      const mockClient = createMockClient();

      await expect(
        downloadFile.callback(params, {
          client: mockClient,
          attachmentsDir: undefined,
        }),
      ).rejects.toThrow(
        "KINTONE_ATTACHMENTS_DIR environment variable must be set to use file download feature",
      );
    });

    it("should return correct mimetype based on file type detection", async () => {
      const mockBuffer = new ArrayBuffer(100);
      mockDownloadFile.mockResolvedValueOnce(mockBuffer);
      vi.mocked(filesystem.getFileTypeFromArrayBuffer).mockResolvedValueOnce({
        mime: "application/pdf",
        ext: "pdf",
      });

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(downloadFile.config.inputSchema!);
      const params = schema.parse({
        fileKey: "test-pdf-file",
        fileName: "document",
      });

      const mockClient = createMockClient();
      mockClient.file.downloadFile = mockDownloadFile;

      const result = await downloadFile.callback(params, {
        client: mockClient,
        attachmentsDir: "/tmp/downloads",
      });

      expect(result.structuredContent).toEqual({
        filePath: "/tmp/downloads/document.pdf",
        mimeType: "application/pdf",
        fileSize: 100,
      });
    });

    it("should throw error when download fails", async () => {
      mockDownloadFile.mockRejectedValueOnce(new Error("Download failed"));

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(downloadFile.config.inputSchema!);
      const params = schema.parse({
        fileKey: "fail-file",
        fileName: "fail-file",
      });

      const mockClient = createMockClient();
      mockClient.file.downloadFile = mockDownloadFile;

      await expect(
        downloadFile.callback(params, {
          client: mockClient,
          attachmentsDir: "/tmp/downloads",
        }),
      ).rejects.toThrow("Download failed");
    });
  });
});
