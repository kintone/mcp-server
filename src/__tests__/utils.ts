import { vi } from "vitest";
import type { KintoneClientConfig } from "../config/index.js";

export const mockExtra = {
  signal: new AbortController().signal,
  requestId: "test-request-123",
  sendNotification: vi.fn().mockResolvedValue(undefined),
  sendRequest: vi.fn().mockResolvedValue({}),
};

export const mockKintoneConfig: KintoneClientConfig = {
  KINTONE_BASE_URL: "https://example.cybozu.com",
  KINTONE_USERNAME: "testuser",
  KINTONE_PASSWORD: "testpass",
  KINTONE_API_TOKEN: undefined,
  KINTONE_BASIC_AUTH_USERNAME: undefined,
  KINTONE_BASIC_AUTH_PASSWORD: undefined,
  HTTPS_PROXY: undefined,
  KINTONE_PFX_FILE_PATH: undefined,
  KINTONE_PFX_FILE_PASSWORD: undefined,
  KINTONE_ATTACHMENTS_DIR: undefined,
};

export const mockKintoneConfigWithApiToken: KintoneClientConfig = {
  KINTONE_BASE_URL: "https://example.cybozu.com",
  KINTONE_USERNAME: undefined,
  KINTONE_PASSWORD: undefined,
  KINTONE_API_TOKEN: "token1,token2,token3",
  KINTONE_BASIC_AUTH_USERNAME: undefined,
  KINTONE_BASIC_AUTH_PASSWORD: undefined,
  HTTPS_PROXY: undefined,
  KINTONE_PFX_FILE_PATH: undefined,
  KINTONE_PFX_FILE_PASSWORD: undefined,
  KINTONE_ATTACHMENTS_DIR: undefined,
};
