import { describe, it, expect, vi, beforeEach } from "vitest";
import { replaceSpecialCharacters, ensureDirectoryExists } from "../file.js";
import fs from "node:fs";

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
  });
});
