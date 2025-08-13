import { vi } from "vitest";
import type { KintoneClientConfig } from "../config.js";

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
  HTTPS_PROXY: undefined,
};
