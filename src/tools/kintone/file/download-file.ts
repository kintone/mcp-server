import { z } from "zod";
import { createTool } from "../../utils.js";
import { getKintoneClient } from "../../../client.js";
import { parseKintoneClientConfig } from "../../../config.js";
import { writeFileSync } from "fs";

const inputSchema = {
  fileKey: z
    .string()
    .describe(
      "The unique file key to download (obtained from record retrieval or file upload)",
    ),
  filepath: z.string().describe("The path to save the downloaded file"),
};

const outputSchema = {
  type: z.string().describe("File type (image, audio, text, etc.)"),
  data: z.string().describe("Base64 encoded file content"),
  mimeType: z.string().describe("MIME type of the downloaded file"),
  fileKey: z.string().describe("Original file key"),
};

export const downloadFile = createTool(
  "kintone-download-file",
  {
    description:
      "Download a file from kintone using its fileKey. You can either save it to a specified path or get the file content as base64. Requires app record viewing permission and permission to view the field containing the file.",
    inputSchema,
    outputSchema,
  },
  async ({ fileKey, filepath }) => {
    const config = parseKintoneClientConfig();
    const client = getKintoneClient(config);

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
    const type = mimeType.split("/")[0];

    if (filepath) {
      writeFileSync(filepath, Buffer.from(buffer));
    }

    // Return file content as base64
    const base64Content = Buffer.from(buffer).toString("base64");

    const result = {
      type,
      data: base64Content,
      mimeType,
      fileKey,
    };

    return {
      structuredContent: result,
      content: [
        type === "image" || type === "audio"
          ? { type, data: base64Content, mimeType, fileKey }
          : {
              type: "text",
              text: `File: ${fileKey}\nMIME: ${mimeType}\nData: [Base64 ${base64Content.length} chars]`,
            },
      ],
    };
  },
);
