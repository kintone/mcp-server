import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateFileName, ensureDirectoryExists } from "../filesystem.js";
import fs from "node:fs";

vi.mock("node:fs");
vi.mock("file-type");

describe("file utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateFileName", () => {
    it("should replace Windows forbidden characters with underscores", () => {
      const input = 'test<>:"|?*\\/file';
      const expected = "test_________file";
      expect(generateFileName(input)).toBe(expected);
    });

    it("should not modify filenames without special characters", () => {
      const input = "normal-filename_123";
      expect(generateFileName(input)).toBe(input);
    });

    it("should handle empty strings", () => {
      expect(generateFileName("")).toBe("");
    });

    it("should replace multiple occurrences of the same character", () => {
      const input = "file:::name***";
      const expected = "file___name___";
      expect(generateFileName(input)).toBe(expected);
    });

    it("should handle all forbidden characters in one string", () => {
      const input = '<>:"|?*\\/';
      const expected = "_________";
      expect(generateFileName(input)).toBe(expected);
    });

    it("should add extension when provided", () => {
      const input = "filename";
      const ext = "txt";
      const expected = "filename.txt";
      expect(generateFileName(input, ext)).toBe(expected);
    });

    it("should replace special characters and add extension", () => {
      const input = "file<>name";
      const ext = "pdf";
      const expected = "file__name.pdf";
      expect(generateFileName(input, ext)).toBe(expected);
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
  });
});
