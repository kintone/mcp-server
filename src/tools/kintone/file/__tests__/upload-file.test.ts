import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import type * as NodeFs from "node:fs";
import { createMockClient } from "../../../../__tests__/utils.js";

vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof NodeFs>("node:fs");
  const mocked = {
    existsSync: vi.fn(),
    statSync: vi.fn(),
    promises: {
      ...actual.promises,
      readFile: vi.fn(),
    },
  };
  return {
    ...actual,
    ...mocked,
    default: {
      ...actual,
      ...mocked,
    },
  };
});

import fs from "node:fs";
import { uploadFile } from "../upload-file.js";

const mockUploadFile = vi.fn();

const expectedDescription =
  "Upload one local file to the temporary storage of kintone via the File REST API (POST /k/v1/file.json) and return its fileKey. " +
  "Only a single file can be uploaded per call, so repeat the call for each file. " +
  "filePath must be an absolute path, or a file name resolved against KINTONE_ATTACHMENTS_DIR. " +
  "The returned fileKey identifies the file in temporary storage and is what an attachment field expects when the file is attached to a record, a space, or an app setting. " +
  "It is a different kind of key from the attachment fileKey returned by record retrieval, and such a retrieval fileKey cannot be re-uploaded or reused here. " +
  "Uploading itself needs no specific permission; the permissions that matter are those of the operation that later attaches the file. " +
  "A file left in temporary storage without being attached is deleted after 3 days, and files in temporary storage also count toward the disk usage of the domain.";

const parseInput = (input: unknown) =>
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  z.object(uploadFile.config.inputSchema!).parse(input);

const createClientWithUpload = () => {
  const mockClient = createMockClient();
  mockClient.file.uploadFile = mockUploadFile;
  return mockClient;
};

describe("upload-file tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({
      isFile: () => true,
    } as NodeFs.Stats);
    vi.mocked(fs.promises.readFile).mockResolvedValue(
      Buffer.from("file content"),
    );
    mockUploadFile.mockResolvedValue({ fileKey: "test-file-key" });
  });

  describe("tool configuration", () => {
    it("should have correct name", () => {
      expect(uploadFile.name).toBe("kintone-upload-file");
    });

    it("should have correct title and description", () => {
      expect(uploadFile.config.title).toBe("Upload File to Kintone");
      expect(uploadFile.config.description).toBe(expectedDescription);
    });

    it("should have valid input schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(uploadFile.config.inputSchema!);

      expect(() =>
        schema.parse({ filePath: "/tmp/uploads/report.pdf" }),
      ).not.toThrow();
      expect(() =>
        schema.parse({
          filePath: "/tmp/uploads/report.pdf",
          fileName: "renamed.pdf",
        }),
      ).not.toThrow();

      // Invalid input - missing or empty filePath
      expect(() => schema.parse({})).toThrow();
      expect(() => schema.parse({ filePath: "" })).toThrow();

      // Invalid input - wrong types and empty fileName
      expect(() => schema.parse({ filePath: 123 })).toThrow();
      expect(() =>
        schema.parse({ filePath: "/tmp/report.pdf", fileName: "" }),
      ).toThrow();
    });

    it("should have valid output schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(uploadFile.config.outputSchema!);

      const validOutput = {
        fileKey: "c15b3870-7505-4ab6-9d8d-b9bdbc74f5d6",
        fileName: "report.pdf",
        fileSize: 1024,
      };
      expect(() => schema.parse(validOutput)).not.toThrow();

      // Invalid output - missing required fields
      expect(() => schema.parse({ fileKey: "key" })).toThrow();
      // Invalid output - wrong type for fileSize
      expect(() =>
        schema.parse({ ...validOutput, fileSize: "1024" }),
      ).toThrow();
    });
  });

  describe("callback function", () => {
    it("should upload a file specified by absolute path", async () => {
      const params = parseInput({ filePath: "/tmp/uploads/report.pdf" });
      const mockClient = createClientWithUpload();

      const result = await uploadFile.callback(params, {
        client: mockClient,
        attachmentsDir: undefined,
      });

      expect(fs.promises.readFile).toHaveBeenCalledWith(
        "/tmp/uploads/report.pdf",
      );
      expect(mockUploadFile).toHaveBeenCalledWith({
        file: { name: "report.pdf", data: Buffer.from("file content") },
      });
      expect(result.structuredContent).toEqual({
        fileKey: "test-file-key",
        fileName: "report.pdf",
        fileSize: Buffer.byteLength("file content"),
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(result.structuredContent, null, 2),
      });
    });

    it("should resolve a relative path against attachmentsDir", async () => {
      const params = parseInput({ filePath: "report.pdf" });
      const mockClient = createClientWithUpload();

      await uploadFile.callback(params, {
        client: mockClient,
        attachmentsDir: "/tmp/uploads",
      });

      expect(fs.existsSync).toHaveBeenCalledWith("/tmp/uploads/report.pdf");
      expect(fs.promises.readFile).toHaveBeenCalledWith(
        "/tmp/uploads/report.pdf",
      );
    });

    it("should throw error when a relative path is given without attachmentsDir", async () => {
      const params = parseInput({ filePath: "report.pdf" });
      const mockClient = createClientWithUpload();

      await expect(
        uploadFile.callback(params, {
          client: mockClient,
          attachmentsDir: undefined,
        }),
      ).rejects.toThrow(
        "filePath must be an absolute path unless KINTONE_ATTACHMENTS_DIR is set: report.pdf",
      );
      expect(mockUploadFile).not.toHaveBeenCalled();
    });

    it("should use fileName instead of the base name of filePath", async () => {
      const params = parseInput({
        filePath: "/tmp/uploads/report.pdf",
        fileName: "見積書.pdf",
      });
      const mockClient = createClientWithUpload();

      const result = await uploadFile.callback(params, {
        client: mockClient,
        attachmentsDir: undefined,
      });

      expect(mockUploadFile).toHaveBeenCalledWith({
        file: { name: "見積書.pdf", data: Buffer.from("file content") },
      });
      expect(result.structuredContent).toMatchObject({
        fileName: "見積書.pdf",
      });
    });

    it("should throw error when the file does not exist", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const params = parseInput({ filePath: "/tmp/uploads/missing.pdf" });
      const mockClient = createClientWithUpload();

      await expect(
        uploadFile.callback(params, {
          client: mockClient,
          attachmentsDir: undefined,
        }),
      ).rejects.toThrow("File not found: /tmp/uploads/missing.pdf");
      expect(mockUploadFile).not.toHaveBeenCalled();
    });

    it("should throw error when filePath points to a directory", async () => {
      vi.mocked(fs.statSync).mockReturnValue({
        isFile: () => false,
      } as NodeFs.Stats);

      const params = parseInput({ filePath: "/tmp/uploads" });
      const mockClient = createClientWithUpload();

      await expect(
        uploadFile.callback(params, {
          client: mockClient,
          attachmentsDir: undefined,
        }),
      ).rejects.toThrow(
        "filePath must point to a file, but it points to a directory: /tmp/uploads",
      );
      expect(mockUploadFile).not.toHaveBeenCalled();
    });

    it("should throw error when fileName contains a path separator", async () => {
      const params = parseInput({
        filePath: "/tmp/uploads/report.pdf",
        fileName: "sub/report.pdf",
      });
      const mockClient = createClientWithUpload();

      await expect(
        uploadFile.callback(params, {
          client: mockClient,
          attachmentsDir: undefined,
        }),
      ).rejects.toThrow(
        "fileName must not contain a path separator: sub/report.pdf",
      );
      expect(mockUploadFile).not.toHaveBeenCalled();
    });

    it("should throw error when the upload fails", async () => {
      mockUploadFile.mockRejectedValueOnce(new Error("Upload failed"));

      const params = parseInput({ filePath: "/tmp/uploads/report.pdf" });
      const mockClient = createClientWithUpload();

      await expect(
        uploadFile.callback(params, {
          client: mockClient,
          attachmentsDir: undefined,
        }),
      ).rejects.toThrow("Upload failed");
    });
  });
});
