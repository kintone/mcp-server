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
  async ({ fileKey }) => {
    const config = parseKintoneClientConfig();
    const client = getKintoneClient(config);

    const buffer = await client.file.downloadFile({ fileKey });
    const mimeType = new Blob([buffer]).type;
    const type = mimeType.split("/")[0];

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
          ? { type, data: base64Content, mimeType }
          : {
              type: "text",
              text: `File: ${fileKey}\nMIME: ${mimeType}\nData: [Base64 ${base64Content.length} chars]`,
            },
      ],
    };
  },
);
