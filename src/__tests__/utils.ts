import { vi } from "vitest";
import type { KintoneClientConfig } from "../config/index.js";

const mockClient = {
  record: {
    getRecords: vi.fn(),
    addRecords: vi.fn(),
    updateRecords: vi.fn(),
    deleteRecords: vi.fn(),
    updateStatus: vi.fn(),
  },
  app: {
    getApp: vi.fn(),
    getApps: vi.fn(),
    getFormFields: vi.fn(),
    getProcessManagement: vi.fn(),
  },
};

export function mockExtra() {
  return {
    client: mockClient,
  };
}

export const mockExtraFlat = {
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
};
