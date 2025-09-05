import { z } from "zod";
import { createTool } from "../../utils.js";
import { getKintoneClient } from "../../../client.js";
import { parseKintoneClientConfig } from "../../../config/index.js";
import {
  ensureDirectoryExists,
  getFileTypeFromArrayBuffer,
  writeFileSyncFromArrayBuffer,
} from "../../../utils/file.js";
import path from "node:path";

const inputSchema = {
  fileKey: z
    .string()
    .describe(
      "The unique file key to download (obtained from record retrieval or file upload)",
    ),
  fileName: z
    .string()
    .describe(
      "The filename to use when downloading to local storage. This will be the actual filename saved on disk",
    ),
};

const outputSchema = {
  filePath: z.string().describe("Absolute path to the downloaded file"),
  mimeType: z.string().describe("MIME type of the downloaded file"),
  fileSize: z.number().describe("File size in bytes"),
};

const generateFileName = (fileName: string, ext?: string) => {
  const extWithDot = ext ? `.${ext}` : "";
  return `${fileName}${extWithDot}`;
};

const generateFilePath = (downloadDir: string, filename: string): string => {
  const filePath = path.join(downloadDir, filename);
  return filePath;
};

export const downloadFile = createTool(
  "kintone-download-file",
  {
    description:
      "Download a file from kintone using its fileKey and save it to the configured download directory. Returns the absolute path to the saved file. Requires KINTONE_ATTACHMENTS_DIR environment variable to be set, app record viewing permission, and permission to view the field containing the file.",
    inputSchema,
    outputSchema,
  },
  async ({ fileKey, fileName }) => {
    const configResult = parseKintoneClientConfig();
    const client = getKintoneClient(configResult);

    // Check if download directory is configured
    if (!configResult.config.KINTONE_ATTACHMENTS_DIR) {
      throw new Error(
        "KINTONE_ATTACHMENTS_DIR environment variable must be set to use file download feature",
      );
    }

    const buffer = await client.file.downloadFile({ fileKey });

    const downloadDir = configResult.config.KINTONE_ATTACHMENTS_DIR;
    ensureDirectoryExists(downloadDir);

    const fileTypeResult = await getFileTypeFromArrayBuffer(buffer);
    const filePath = generateFilePath(
      downloadDir,
      generateFileName(fileName, fileTypeResult?.ext),
    );

    writeFileSyncFromArrayBuffer(filePath, buffer);

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
  },
);
