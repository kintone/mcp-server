import { fileTypeFromBuffer } from "file-type";
import fs from "node:fs";
import path from "node:path";

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

export const writeFileSyncWithoutOverwrite = (
  filePath: string,
  arrayBuffer: ArrayBuffer,
) => {
  const buffer = Buffer.from(arrayBuffer);
  const uniqueFilePath = generateUniqueLocalFilePath(filePath);
  fs.writeFileSync(uniqueFilePath, buffer);
};

export const getFileTypeFromArrayBuffer = async (arrayBuffer: ArrayBuffer) => {
  return fileTypeFromBuffer(arrayBuffer);
};

const generateUniqueLocalFilePath: (filePath: string) => string = (
  filePath,
) => {
  const internal: (index: number) => string = (index) => {
    const newFileName =
      index === 0
        ? path.basename(filePath)
        : `${path.basename(
            filePath,
            path.extname(filePath),
          )} (${index})${path.extname(filePath)}`;
    const newFilePath = path.join(path.dirname(filePath), newFileName);
    if (fs.existsSync(newFilePath)) {
      return internal(index + 1);
    }
    return newFilePath;
  };
  return internal(0);
};
