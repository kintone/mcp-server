import { vi } from "vitest";

export const mockExtra = {
  signal: new AbortController().signal,
  requestId: "test-request-123",
  sendNotification: vi.fn().mockResolvedValue(undefined),
  sendRequest: vi.fn().mockResolvedValue({}),
};
