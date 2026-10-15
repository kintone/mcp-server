import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { createTool } from "../../factory.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const inputSchema = {
  filePath: z
    .string()
    .min(1)
    .describe(
      "Path to the local file to upload. Absolute path, or a file name resolved against KINTONE_ATTACHMENTS_DIR.",
    ),
  fileName: z
    .string()
    .min(1)
    .optional()
    .describe(
      "File name to register in kintone. Defaults to the base name of filePath. Must not contain a path separator; a non-ASCII name is sent as UTF-8.",
    ),
};

const outputSchema = {
  fileKey: z
    .string()
    .describe(
      "File key of the uploaded file in temporary storage, used as the value of an attachment field when the file is attached to a record or space",
    ),
  fileName: z.string().describe("File name that was registered in kintone"),
  fileSize: z.number().describe("Size of the uploaded file in bytes"),
};

const resolveUploadFilePath = (
  filePath: string,
  attachmentsDir: string | undefined,
): string => {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  if (!attachmentsDir) {
    throw new Error(
      `filePath must be an absolute path unless KINTONE_ATTACHMENTS_DIR is set: ${filePath}`,
    );
  }
  return path.resolve(attachmentsDir, filePath);
};

const toolName = "kintone-upload-file";
const toolConfig = {
  title: "Upload File to Kintone",
  description:
    "Upload one local file to the temporary storage of kintone via the File REST API (POST /k/v1/file.json) and return its fileKey. " +
    "Only a single file can be uploaded per call, so repeat the call for each file. " +
    "filePath must be an absolute path, or a file name resolved against KINTONE_ATTACHMENTS_DIR. " +
    "The returned fileKey identifies the file in temporary storage and is what an attachment field expects when the file is attached to a record, a space, or an app setting. " +
    "It is a different kind of key from the attachment fileKey returned by record retrieval, and such a retrieval fileKey cannot be re-uploaded or reused here. " +
    "Uploading itself needs no specific permission; the permissions that matter are those of the operation that later attaches the file. " +
    "A file left in temporary storage without being attached is deleted after 3 days, and files in temporary storage also count toward the disk usage of the domain.",
  inputSchema,
  outputSchema,
};

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { filePath, fileName },
  { client, attachmentsDir },
) => {
  const resolvedPath = resolveUploadFilePath(filePath, attachmentsDir);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }
  if (!fs.statSync(resolvedPath).isFile()) {
    throw new Error(
      `filePath must point to a file, but it points to a directory: ${resolvedPath}`,
    );
  }

  const name = fileName ?? path.basename(resolvedPath);
  if (name !== path.basename(name)) {
    throw new Error(`fileName must not contain a path separator: ${name}`);
  }

  const data = await fs.promises.readFile(resolvedPath);

  const { fileKey } = await client.file.uploadFile({
    file: { name, data },
  });

  const result = {
    fileKey,
    fileName: name,
    fileSize: data.byteLength,
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

export const uploadFile = createTool(toolName, toolConfig, callback);
