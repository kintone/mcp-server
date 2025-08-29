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

    // KintoneRestAPIClientのモック
    vi.mocked(KintoneRestAPIClient).mockImplementation(() => mockClient as any);

    // pathモジュールの実際の動作を維持
    vi.mocked(path.join).mockImplementation((...args) => args.join("/"));
  });

  describe("正常系", () => {
    it("ファイルを正常にダウンロードして保存できる", async () => {
      // 環境変数の設定
      process.env.KINTONE_BASE_URL = "https://example.cybozu.com";
      process.env.KINTONE_USERNAME = "testuser";
      process.env.KINTONE_PASSWORD = "testpass";
      process.env.KINTONE_ATTACHMENTS_DIR = "/tmp/downloads";

      // モックの設定
      const mockBuffer = new ArrayBuffer(100);
      mockDownloadFile.mockResolvedValue(mockBuffer);

      vi.mocked(getFileTypeFromArrayBuffer).mockResolvedValue({
        mime: "image/png",
        ext: "png",
      });

      // 実行
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

    it("拡張子が取得できない場合でもファイルを保存できる", async () => {
      // 環境変数の設定
      process.env.KINTONE_BASE_URL = "https://example.cybozu.com";
      process.env.KINTONE_USERNAME = "testuser";
      process.env.KINTONE_PASSWORD = "testpass";
      process.env.KINTONE_ATTACHMENTS_DIR = "/tmp/downloads";

      // モックの設定
      const mockBuffer = new ArrayBuffer(50);
      mockDownloadFile.mockResolvedValue(mockBuffer);

      vi.mocked(getFileTypeFromArrayBuffer).mockResolvedValue(null);

      // 実行
      const result = await downloadFile.callback(
        { fileKey: "no-ext-file" },
        mockExtra,
      );

      // 検証
      expect(result.structuredContent).toEqual({
        filePath: "/tmp/downloads/no-ext-file",
        mimeType: "application/octet-stream",
        fileSize: 50,
      });
    });

    it("Basic認証が設定されている場合も正常動作する", async () => {
      // 環境変数の設定
      process.env.KINTONE_BASE_URL = "https://example.cybozu.com";
      process.env.KINTONE_USERNAME = "testuser";
      process.env.KINTONE_PASSWORD = "testpass";
      process.env.KINTONE_BASIC_AUTH_USERNAME = "basicuser";
      process.env.KINTONE_BASIC_AUTH_PASSWORD = "basicpass";
      process.env.KINTONE_ATTACHMENTS_DIR = "/tmp/downloads";

      // モックの設定
      const mockBuffer = new ArrayBuffer(200);
      mockDownloadFile.mockResolvedValue(mockBuffer);

      vi.mocked(getFileTypeFromArrayBuffer).mockResolvedValue({
        mime: "application/pdf",
        ext: "pdf",
      });

      // 実行
      const result = await downloadFile.callback(
        { fileKey: "pdf-file-key" },
        mockExtra,
      );

      // 検証
      expect(result.structuredContent).toEqual({
        filePath: "/tmp/downloads/pdf-file-key.pdf",
        mimeType: "application/pdf",
        fileSize: 200,
      });
    });
  });

  describe("エラー系", () => {
    it("KINTONE_ATTACHMENTS_DIRが設定されていない場合はエラー", async () => {
      // 環境変数の設定（ATTACHMENTS_DIRなし）
      process.env.KINTONE_BASE_URL = "https://example.cybozu.com";
      process.env.KINTONE_USERNAME = "testuser";
      process.env.KINTONE_PASSWORD = "testpass";
      delete process.env.KINTONE_ATTACHMENTS_DIR;

      // 実行と検証
      await expect(
        downloadFile.callback({ fileKey: "test-file" }, mockExtra),
      ).rejects.toThrow(
        "KINTONE_ATTACHMENTS_DIR environment variable must be set to use file download feature",
      );
    });

    it("必須の環境変数が不足している場合はエラー", async () => {
      // 環境変数をクリア
      delete process.env.KINTONE_BASE_URL;
      delete process.env.KINTONE_USERNAME;
      delete process.env.KINTONE_PASSWORD;
      process.env.KINTONE_ATTACHMENTS_DIR = "/tmp/downloads";

      // 実行と検証
      await expect(
        downloadFile.callback({ fileKey: "test-file" }, mockExtra),
      ).rejects.toThrow();
    });

    it("ダウンロードに失敗した場合はエラー", async () => {
      // 環境変数の設定
      process.env.KINTONE_BASE_URL = "https://example.cybozu.com";
      process.env.KINTONE_USERNAME = "testuser";
      process.env.KINTONE_PASSWORD = "testpass";
      process.env.KINTONE_ATTACHMENTS_DIR = "/tmp/downloads";

      // モックの設定
      mockDownloadFile.mockRejectedValue(new Error("Download failed"));

      // 実行と検証
      await expect(
        downloadFile.callback({ fileKey: "fail-file" }, mockExtra),
      ).rejects.toThrow("Download failed");
    });

    it("不正なfileKeyの場合はバリデーションエラー", async () => {
      // 環境変数の設定
      process.env.KINTONE_BASE_URL = "https://example.cybozu.com";
      process.env.KINTONE_USERNAME = "testuser";
      process.env.KINTONE_PASSWORD = "testpass";
      process.env.KINTONE_ATTACHMENTS_DIR = "/tmp/downloads";

      // 実行と検証（fileKeyが数値の場合）
      await expect(
        downloadFile.callback({ fileKey: 123 as any }, mockExtra),
      ).rejects.toThrow();
    });
  });

  describe("ツールメタデータ", () => {
    it("正しいツール名とdescriptionを持つ", () => {
      expect(downloadFile.name).toBe("kintone-download-file");
      expect(downloadFile.config.description).toContain(
        "Download a file from kintone",
      );
      expect(downloadFile.config.description).toContain(
        "KINTONE_ATTACHMENTS_DIR",
      );
    });

    it("正しい入力スキーマを持つ", () => {
      const inputSchema = downloadFile.config.inputSchema;
      expect(inputSchema).toBeDefined();
      expect(inputSchema.fileKey).toBeDefined();
    });

    it("正しい出力スキーマを持つ", () => {
      const outputSchema = downloadFile.config.outputSchema;
      expect(outputSchema).toBeDefined();
      expect(outputSchema.filePath).toBeDefined();
      expect(outputSchema.mimeType).toBeDefined();
      expect(outputSchema.fileSize).toBeDefined();
    });
  });
});
