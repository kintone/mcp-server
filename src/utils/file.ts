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
export const generateSafeFilename = (fileKey: string, ext: string): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);

  // Create generic name
  const baseName = fileKey;
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

/**
 * Get file extension from MIME type
 */
export const getExtensionFromMimeType = (mimeType: string): string => {
  // TODO: これどないするー
  const mimeToExt: Record<string, string> = {
    // Images
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/bmp": ".bmp",
    "image/tiff": ".tiff",
    "image/tif": ".tif",

    // Documents
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      ".xlsx",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      ".pptx",
    "text/plain": ".txt",
    "text/html": ".html",
    "text/css": ".css",
    "text/javascript": ".js",
    "application/json": ".json",
    "application/xml": ".xml",

    // Audio
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
    "audio/wav": ".wav",
    "audio/ogg": ".ogg",
    "audio/aac": ".aac",
    "audio/flac": ".flac",

    // Video
    "video/mp4": ".mp4",
    "video/avi": ".avi",
    "video/mov": ".mov",
    "video/wmv": ".wmv",
    "video/flv": ".flv",
    "video/webm": ".webm",

    // Archives
    "application/zip": ".zip",
    "application/x-rar-compressed": ".rar",
    "application/x-7z-compressed": ".7z",
    "application/gzip": ".gz",
    "application/x-tar": ".tar",

    // Other common types
    "application/octet-stream": ".bin",
    "application/x-binary": ".bin",
  };

  return mimeToExt[mimeType.toLowerCase()] || "";
};
