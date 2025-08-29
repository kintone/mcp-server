import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  replaceSpecialCharacters,
  ensureDirectoryExists,
  writeFileSyncFromArrayBuffer,
  getFileTypeFromArrayBuffer,
} from "../file.js";
import fs from "node:fs";
import { fileTypeFromBuffer } from "file-type";

vi.mock("node:fs");
vi.mock("file-type");

describe("file utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("replaceSpecialCharacters", () => {
    it("should replace Windows forbidden characters with underscores", () => {
      const input = 'test<>:"|?*\\/file.txt';
      const expected = "test_________file.txt";
      expect(replaceSpecialCharacters(input)).toBe(expected);
    });

    it("should not modify filenames without special characters", () => {
      const input = "normal-filename_123.txt";
      expect(replaceSpecialCharacters(input)).toBe(input);
    });

    it("should handle empty strings", () => {
      expect(replaceSpecialCharacters("")).toBe("");
    });

    it("should replace multiple occurrences of the same character", () => {
      const input = "file:::name***.txt";
      const expected = "file___name___.txt";
      expect(replaceSpecialCharacters(input)).toBe(expected);
    });

    it("should handle all forbidden characters in one string", () => {
      const input = '<>:"|?*\\/';
      const expected = "_________";
      expect(replaceSpecialCharacters(input)).toBe(expected);
    });
  });

  describe("ensureDirectoryExists", () => {
    it("should create directory if it doesn't exist", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const mkdirSyncMock = vi.mocked(fs.mkdirSync);

      ensureDirectoryExists("/test/path");

      expect(fs.existsSync).toHaveBeenCalledWith("/test/path");
      expect(mkdirSyncMock).toHaveBeenCalledWith("/test/path", {
        recursive: true,
      });
    });

    it("should not create directory if it already exists", () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const mkdirSyncMock = vi.mocked(fs.mkdirSync);

      ensureDirectoryExists("/existing/path");

      expect(fs.existsSync).toHaveBeenCalledWith("/existing/path");
      expect(mkdirSyncMock).not.toHaveBeenCalled();
    });

    it("should handle nested paths", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const mkdirSyncMock = vi.mocked(fs.mkdirSync);

      ensureDirectoryExists("/deeply/nested/directory/path");

      expect(fs.existsSync).toHaveBeenCalledWith("/deeply/nested/directory/path");
      expect(mkdirSyncMock).toHaveBeenCalledWith(
        "/deeply/nested/directory/path",
        { recursive: true }
      );
    });
  });

  describe("writeFileSyncFromArrayBuffer", () => {
    it("should write ArrayBuffer to file as Buffer", () => {
      const arrayBuffer = new ArrayBuffer(8);
      const uint8Array = new Uint8Array(arrayBuffer);
      uint8Array.set([1, 2, 3, 4, 5, 6, 7, 8]);

      const writeFileSyncMock = vi.mocked(fs.writeFileSync);

      writeFileSyncFromArrayBuffer("/test/file.bin", arrayBuffer);

      expect(writeFileSyncMock).toHaveBeenCalledWith(
        "/test/file.bin",
        expect.any(Buffer)
      );

      const calledBuffer = writeFileSyncMock.mock.calls[0][1] as Buffer;
      expect(calledBuffer).toBeInstanceOf(Buffer);
      expect(Array.from(calledBuffer)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it("should handle empty ArrayBuffer", () => {
      const arrayBuffer = new ArrayBuffer(0);
      const writeFileSyncMock = vi.mocked(fs.writeFileSync);

      writeFileSyncFromArrayBuffer("/test/empty.bin", arrayBuffer);

      expect(writeFileSyncMock).toHaveBeenCalledWith(
        "/test/empty.bin",
        expect.any(Buffer)
      );

      const calledBuffer = writeFileSyncMock.mock.calls[0][1] as Buffer;
      expect(calledBuffer.length).toBe(0);
    });

    it("should handle large ArrayBuffer", () => {
      const size = 1024 * 1024; // 1MB
      const arrayBuffer = new ArrayBuffer(size);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < size; i++) {
        uint8Array[i] = i % 256;
      }

      const writeFileSyncMock = vi.mocked(fs.writeFileSync);

      writeFileSyncFromArrayBuffer("/test/large.bin", arrayBuffer);

      expect(writeFileSyncMock).toHaveBeenCalledWith(
        "/test/large.bin",
        expect.any(Buffer)
      );

      const calledBuffer = writeFileSyncMock.mock.calls[0][1] as Buffer;
      expect(calledBuffer.length).toBe(size);
    });
  });

  describe("getFileTypeFromArrayBuffer", () => {
    it("should return file type information for valid file", async () => {
      const mockFileType = {
        ext: "png",
        mime: "image/png",
      };
      vi.mocked(fileTypeFromBuffer).mockResolvedValue(mockFileType);

      const arrayBuffer = new ArrayBuffer(100);
      const result = await getFileTypeFromArrayBuffer(arrayBuffer);

      expect(result).toEqual(mockFileType);
      expect(fileTypeFromBuffer).toHaveBeenCalledWith(arrayBuffer);
    });

    it("should return null for unknown file type", async () => {
      vi.mocked(fileTypeFromBuffer).mockResolvedValue(undefined);

      const arrayBuffer = new ArrayBuffer(100);
      const result = await getFileTypeFromArrayBuffer(arrayBuffer);

      expect(result).toBeUndefined();
      expect(fileTypeFromBuffer).toHaveBeenCalledWith(arrayBuffer);
    });

    it("should handle PDF files", async () => {
      const mockFileType = {
        ext: "pdf",
        mime: "application/pdf",
      };
      vi.mocked(fileTypeFromBuffer).mockResolvedValue(mockFileType);

      const arrayBuffer = new ArrayBuffer(200);
      const result = await getFileTypeFromArrayBuffer(arrayBuffer);

      expect(result).toEqual(mockFileType);
      expect(result?.mime).toBe("application/pdf");
      expect(result?.ext).toBe("pdf");
    });

    it("should handle JPEG files", async () => {
      const mockFileType = {
        ext: "jpg",
        mime: "image/jpeg",
      };
      vi.mocked(fileTypeFromBuffer).mockResolvedValue(mockFileType);

      const arrayBuffer = new ArrayBuffer(150);
      const result = await getFileTypeFromArrayBuffer(arrayBuffer);

      expect(result).toEqual(mockFileType);
      expect(result?.mime).toBe("image/jpeg");
      expect(result?.ext).toBe("jpg");
    });

    it("should handle empty ArrayBuffer", async () => {
      vi.mocked(fileTypeFromBuffer).mockResolvedValue(undefined);

      const arrayBuffer = new ArrayBuffer(0);
      const result = await getFileTypeFromArrayBuffer(arrayBuffer);

      expect(result).toBeUndefined();
      expect(fileTypeFromBuffer).toHaveBeenCalledWith(arrayBuffer);
    });
  });
});