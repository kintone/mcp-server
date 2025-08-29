import { fileTypeFromBuffer } from "file-type";
import fs from "node:fs";

/**
 * Replace special characters in filename for Windows compatibility
 */
export const replaceSpecialCharacters = (filename: string): string => {
  // Windows forbidden characters: < > : " | ? * \ /
  return filename.replace(/[<>:"|?*\\/]/g, "_");
};

/**
 * Ensure directory exists, create if it doesn't
 */
export const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export const writeFileSyncFromArrayBuffer = (
  filePath: string,
  arrayBuffer: ArrayBuffer,
) => {
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filePath, buffer);
};

export const getFileTypeFromArrayBuffer = async (arrayBuffer: ArrayBuffer) => {
  return fileTypeFromBuffer(arrayBuffer);
};
