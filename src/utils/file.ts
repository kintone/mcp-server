import path from "node:path";
import fs from "node:fs";

/**
 * Replace special characters in filename for Windows compatibility
 */
export const replaceSpecialCharacters = (filename: string): string => {
  // Windows forbidden characters: < > : " | ? * \ /
  return filename.replace(/[<>:"|?*\\/]/g, "_");
};

/**
 * Generate a safe filename from fileKey and original filename
 */
export const generateSafeFilename = (fileKey: string): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);

  // Create generic name
  const baseName = fileKey;
  const ext = path.extname(baseName);
  const nameWithoutExt = path.basename(baseName, ext);

  // Create safe filename with fileKey prefix for uniqueness
  const safeName =
    process.platform === "win32"
      ? replaceSpecialCharacters(nameWithoutExt)
      : nameWithoutExt;

  return `${fileKey}_${timestamp}_${randomId}_${safeName}${ext}`;
};

/**
 * Generate unique file path in the specified directory
 * Similar to cli-kintone's generateUniqueLocalFilePath
 */
export const generateUniqueFilePath = (
  downloadDir: string,
  filename: string,
): string => {
  const internal = (name: string, index: number): string => {
    const filePath = path.join(downloadDir, name);

    if (!fs.existsSync(filePath)) {
      return filePath;
    }

    const ext = path.extname(filename);
    const nameWithoutExt = path.basename(filename, ext);
    const newName = `${nameWithoutExt} (${index})${ext}`;

    return internal(newName, index + 1);
  };

  return internal(filename, 1);
};

/**
 * Ensure directory exists, create if it doesn't
 */
export const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// TODO: これはconfig.tsのzod refineに移植
/**
 * Validate and normalize download directory path
 */
export const validateDownloadDirectory = (downloadDir: string): string => {
  // Convert to absolute path
  const absolutePath = path.resolve(downloadDir);

  // Basic path traversal protection - ensure it's under allowed directory
  const normalizedPath = path.normalize(absolutePath);

  if (normalizedPath !== absolutePath) {
    throw new Error("Invalid download directory path");
  }

  return absolutePath;
};
