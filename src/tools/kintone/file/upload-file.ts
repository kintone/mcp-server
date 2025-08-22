import { z } from "zod";
import { createTool } from "../../utils.js";
import { getKintoneClient } from "../../../client.js";
import { parseKintoneClientConfig } from "../../../config.js";

const inputSchema = {
  filePath: z.string().describe("The absolute path to the file to upload"),
  fileName: z
    .string()
    .optional()
    .describe(
      "Optional filename to use for the upload. If not provided, uses the original filename from the path.",
    ),
};

const outputSchema = {
  fileKey: z
    .string()
    .describe(
      "The unique file key that can be used to attach the file to records",
    ),
};

export const uploadFile = createTool(
  "kintone-upload-file",
  {
    description:
      "Upload a file to kintone. Returns a fileKey that can be used to attach the file to records. Uploaded files are temporarily stored and will be deleted after 3 days if not attached to a record.",
    inputSchema,
    outputSchema,
  },
  async ({ filePath, fileName }) => {
    const config = parseKintoneClientConfig();
    const client = getKintoneClient(config);

    // Extract filename from path if not provided
    const finalFileName =
      fileName || filePath.split("/").pop() || "uploaded-file";

    const response = await client.file.uploadFile({
      file: {
        path: filePath,
        name: finalFileName,
      },
    });

    const result = {
      fileKey: response.fileKey,
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
