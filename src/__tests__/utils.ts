import { vi } from "vitest";
import type { KintoneRestAPIClient } from "@kintone/rest-api-client";
import type {
  KintoneClientConfig,
  ProvidedConfig,
} from "../config/types/config";

export const createMockClient = (): KintoneRestAPIClient =>
  ({
    record: {
      getRecords: vi.fn(),
      addRecords: vi.fn(),
      updateRecords: vi.fn(),
      deleteRecords: vi.fn(),
      updateStatus: vi.fn(),
      updateRecordsStatus: vi.fn(),
    },
    app: {
      getApp: vi.fn(),
      getApps: vi.fn(),
      getFormFields: vi.fn(),
      getFormLayout: vi.fn(),
      updateFormFields: vi.fn(),
      deleteFormFields: vi.fn(),
      getProcessManagement: vi.fn(),
      getDeployStatus: vi.fn(),
      getAppSettings: vi.fn(),
      addApp: vi.fn(),
      deployApp: vi.fn(),
      updateAppSettings: vi.fn(),
      addFormFields: vi.fn(),
    },
    file: {
      downloadFile: vi.fn(),
    },
  }) as unknown as KintoneRestAPIClient;

export function mockToolCallbackOptions(client?: KintoneRestAPIClient) {
  return {
    client: client || createMockClient(),
    version: "1.0.0",
  };
}

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
  USER_AGENT: "@kintone/mcp-server@1.0.0",
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
  USER_AGENT: "@kintone/mcp-server@1.0.0",
};

export const mockProvidedConfig: ProvidedConfig = {
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

export const mockProvidedConfigWithApiToken: ProvidedConfig = {
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
