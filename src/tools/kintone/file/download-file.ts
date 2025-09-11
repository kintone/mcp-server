import { z } from "zod";
import {
  ensureDirectoryExists,
  generateFileName,
  generateFilePath,
  getFileTypeFromArrayBuffer,
  writeFileSyncWithoutOverwrite,
} from "../../../lib/filesystem.js";
import type { KintoneToolCallback } from "../../types/tool.js";
import { createTool } from "../../factory.js";

const inputSchema = {
  fileKey: z
    .string()
    .describe(
      "The unique file key to download (obtained from record retrieval or file upload)",
    ),
  fileName: z
    .string()
    .describe(
      "The filename (without extension) to use when downloading to local storage. The extension will be automatically detected and added based on the file's MIME type",
    ),
};

const outputSchema = {
  filePath: z.string().describe("Absolute path to the downloaded file"),
  mimeType: z.string().describe("MIME type of the downloaded file"),
  fileSize: z.number().describe("File size in bytes"),
};

const toolName = "kintone-download-file";
const toolConfig = {
  title: "Download File from Kintone",
  description:
    "Download a file from kintone using its fileKey and save it to the configured download directory. Returns the absolute path to the saved file. Requires KINTONE_ATTACHMENTS_DIR environment variable to be set, app record viewing permission, and permission to view the field containing the file.",
  inputSchema,
  outputSchema,
};
const callback: KintoneToolCallback<typeof inputSchema> = async (
  { fileKey, fileName },
  { client, attachmentsDir },
) => {
  // Check if download directory is configured
  if (!attachmentsDir) {
    throw new Error(
      "KINTONE_ATTACHMENTS_DIR environment variable must be set to use file download feature",
    );
  }

  const buffer = await client.file.downloadFile({ fileKey });

  ensureDirectoryExists(attachmentsDir);

  const fileTypeResult = await getFileTypeFromArrayBuffer(buffer);
  const filePath = generateFilePath(
    attachmentsDir,
    generateFileName(fileName, fileTypeResult?.ext),
  );

  writeFileSyncWithoutOverwrite(filePath, buffer);

  const result = {
    filePath,
    mimeType: fileTypeResult?.mime || "application/octet-stream",
    fileSize: buffer.byteLength,
  };

  return {
    structuredContent: result,
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
};

export const downloadFile = createTool(toolName, toolConfig, callback);
