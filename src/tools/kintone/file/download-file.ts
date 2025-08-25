import { z } from "zod";
import fs from "node:fs";
import { createTool } from "../../utils.js";
import { getKintoneClient } from "../../../client.js";
import { parseKintoneClientConfig } from "../../../config.js";
import {
  generateSafeFilename,
  generateUniqueFilePath,
  ensureDirectoryExists,
  validateDownloadDirectory,
} from "../../../utils/file.js";

const inputSchema = {
  fileKey: z
    .string()
    .describe(
      "The unique file key to download (obtained from record retrieval or file upload)",
    ),
};

const outputSchema = {
  filePath: z.string().describe("Absolute path to the downloaded file"),
  mimeType: z.string().describe("MIME type of the downloaded file"),
  fileSize: z.number().describe("File size in bytes"),
};

export const downloadFile = createTool(
  "kintone-download-file",
  {
    description:
      "Download a file from kintone using its fileKey and save it to the configured download directory. Returns the absolute path to the saved file. Requires KINTONE_DOWNLOAD_DIR environment variable to be set, app record viewing permission, and permission to view the field containing the file.",
    inputSchema,
    outputSchema,
  },
  async ({ fileKey }) => {
    const configResult = parseKintoneClientConfig();
    const client = getKintoneClient(configResult);

    // Check if download directory is configured
    if (!configResult.config.KINTONE_DOWNLOAD_DIR) {
      throw new Error(
        "KINTONE_DOWNLOAD_DIR environment variable must be set to use file download feature",
      );
    }

    const buffer = await client.file.downloadFile({ fileKey });
    // Detect MIME type from buffer magic bytes
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const detectMimeType = (buffer: ArrayBuffer): string => {
      const bytes = new Uint8Array(buffer.slice(0, 12));

      // PNG: 89 50 4E 47
      if (
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47
      ) {
        return "image/png";
      }
      // JPEG: FF D8 FF
      if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return "image/jpeg";
      }
      // GIF: 47 49 46
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
        return "image/gif";
      }
      // PDF: 25 50 44 46
      if (
        bytes[0] === 0x25 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x44 &&
        bytes[3] === 0x46
      ) {
        return "application/pdf";
      }
      // MP3: FF FB or ID3
      if (
        (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) ||
        (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33)
      ) {
        return "audio/mpeg";
      }
      // WAV: 52 49 46 46
      if (
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46
      ) {
        return "audio/wav";
      }

      return "application/octet-stream";
    };

    const mimeType = detectMimeType(buffer);

    // TODO: こいつはconfig.tsのrefineに移動
    // Validate and prepare download directory
    const downloadDir = validateDownloadDirectory(
      configResult.config.KINTONE_DOWNLOAD_DIR,
    );
    ensureDirectoryExists(downloadDir);

    // Generate safe filename and unique file path
    const safeFilename = generateSafeFilename(fileKey);
    const uniqueFilePath = generateUniqueFilePath(downloadDir, safeFilename);

    // Save file to local directory
    const bufferData = Buffer.from(buffer);
    fs.writeFileSync(uniqueFilePath, bufferData);

    const result = {
      filePath: uniqueFilePath,
      mimeType,
      fileSize: bufferData.length,
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
