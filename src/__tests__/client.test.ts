import { describe, it, expect, beforeEach, vi } from "vitest";
import { getKintoneClient, resetKintoneClient } from "../client.js";
import type { KintoneClientConfig } from "../config.js";
import { mockKintoneConfig } from "./utils.js";

// Mock the KintoneRestAPIClient
vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: vi.fn(),
}));

describe("client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetKintoneClient();
  });

  describe("getKintoneClient", () => {
    it("should create a new client with provided config", async () => {
      const config = mockKintoneConfig;

      const { KintoneRestAPIClient } = vi.mocked(
        await import("@kintone/rest-api-client"),
      );
      const mockClient = { app: { getApp: vi.fn() } };
      (KintoneRestAPIClient as any).mockReturnValue(mockClient);

      const client = getKintoneClient(config);

      expect(KintoneRestAPIClient).toHaveBeenCalledWith({
        baseUrl: mockKintoneConfig.KINTONE_BASE_URL,
        auth: {
          username: mockKintoneConfig.KINTONE_USERNAME,
          password: mockKintoneConfig.KINTONE_PASSWORD,
        },
      });
      expect(client).toBe(mockClient);
    });

    it("should return the same instance on subsequent calls", async () => {
      const config = mockKintoneConfig;

      const { KintoneRestAPIClient } = vi.mocked(
        await import("@kintone/rest-api-client"),
      );
      const mockClient = { app: { getApp: vi.fn() } };
      (KintoneRestAPIClient as any).mockReturnValue(mockClient);

      const client1 = getKintoneClient(config);
      const client2 = getKintoneClient(config);

      expect(client1).toBe(client2);
      expect(KintoneRestAPIClient).toHaveBeenCalledTimes(1);
    });

    it("should work with different config values", async () => {
      const config = mockKintoneConfig;

      const { KintoneRestAPIClient } = vi.mocked(
        await import("@kintone/rest-api-client"),
      );
      const mockClient = { app: { getApp: vi.fn() } };
      (KintoneRestAPIClient as any).mockReturnValue(mockClient);

      const client = getKintoneClient(config);

      expect(KintoneRestAPIClient).toHaveBeenCalledWith({
        baseUrl: mockKintoneConfig.KINTONE_BASE_URL,
        auth: {
          username: mockKintoneConfig.KINTONE_USERNAME,
          password: mockKintoneConfig.KINTONE_PASSWORD,
        },
      });
      expect(client).toBe(mockClient);
    });

    it("should handle config with URL containing path", async () => {
      const config = {
        ...mockKintoneConfig,
        KINTONE_BASE_URL: "https://example.cybozu.com/k/",
      };

      const { KintoneRestAPIClient } = vi.mocked(
        await import("@kintone/rest-api-client"),
      );
      const mockClient = { app: { getApp: vi.fn() } };
      (KintoneRestAPIClient as any).mockReturnValue(mockClient);

      const client = getKintoneClient(config);

      expect(KintoneRestAPIClient).toHaveBeenCalledWith({
        baseUrl: "https://example.cybozu.com/k/",
        auth: {
          username: mockKintoneConfig.KINTONE_USERNAME,
          password: mockKintoneConfig.KINTONE_PASSWORD,
        },
      });
    });

    it("should handle config with http protocol", async () => {
      const config = {
        ...mockKintoneConfig,
        KINTONE_BASE_URL: "http://localhost:8080",
      };

      const { KintoneRestAPIClient } = vi.mocked(
        await import("@kintone/rest-api-client"),
      );
      const mockClient = { app: { getApp: vi.fn() } };
      (KintoneRestAPIClient as any).mockReturnValue(mockClient);

      const client = getKintoneClient(config);

      expect(KintoneRestAPIClient).toHaveBeenCalledWith({
        baseUrl: "http://localhost:8080",
        auth: {
          username: mockKintoneConfig.KINTONE_USERNAME,
          password: mockKintoneConfig.KINTONE_PASSWORD,
        },
      });
    });
  });

  describe("resetKintoneClient", () => {
    it("should reset the client instance", async () => {
      const config = mockKintoneConfig;

      const { KintoneRestAPIClient } = vi.mocked(
        await import("@kintone/rest-api-client"),
      );
      const mockClient1 = { app: { getApp: vi.fn() }, id: 1 };
      const mockClient2 = { app: { getApp: vi.fn() }, id: 2 };
      (KintoneRestAPIClient as any)
        .mockReturnValueOnce(mockClient1)
        .mockReturnValueOnce(mockClient2);

      const client1 = getKintoneClient(config);
      resetKintoneClient();
      const client2 = getKintoneClient(config);

      expect(client1).toBe(mockClient1);
      expect(client2).toBe(mockClient2);
      expect(client1).not.toBe(client2);
      expect(KintoneRestAPIClient).toHaveBeenCalledTimes(2);
    });

    it("should allow creating new client after reset", async () => {
      const config1 = {
        ...mockKintoneConfig,
        KINTONE_BASE_URL: "https://example1.cybozu.com",
      };
      const config2 = {
        ...mockKintoneConfig,
        KINTONE_BASE_URL: "https://example2.cybozu.com",
      };

      const { KintoneRestAPIClient } = vi.mocked(
        await import("@kintone/rest-api-client"),
      );
      const mockClient1 = { app: { getApp: vi.fn() }, id: 1 };
      const mockClient2 = { app: { getApp: vi.fn() }, id: 2 };
      (KintoneRestAPIClient as any)
        .mockReturnValueOnce(mockClient1)
        .mockReturnValueOnce(mockClient2);

      const client1 = getKintoneClient(config1);
      expect(KintoneRestAPIClient).toHaveBeenCalledWith({
        baseUrl: "https://example1.cybozu.com",
        auth: {
          username: mockKintoneConfig.KINTONE_USERNAME,
          password: mockKintoneConfig.KINTONE_PASSWORD,
        },
      });

      resetKintoneClient();

      const client2 = getKintoneClient(config2);
      expect(KintoneRestAPIClient).toHaveBeenCalledWith({
        baseUrl: "https://example2.cybozu.com",
        auth: {
          username: mockKintoneConfig.KINTONE_USERNAME,
          password: mockKintoneConfig.KINTONE_PASSWORD,
        },
      });

      expect(client1).not.toBe(client2);
    });
  });

  describe("integration scenarios", () => {
    it("should maintain singleton behavior until reset", async () => {
      const config = mockKintoneConfig;

      const { KintoneRestAPIClient } = vi.mocked(
        await import("@kintone/rest-api-client"),
      );
      const mockClient1 = { app: { getApp: vi.fn() }, id: 1 };
      const mockClient2 = { app: { getApp: vi.fn() }, id: 2 };
      (KintoneRestAPIClient as any)
        .mockReturnValueOnce(mockClient1)
        .mockReturnValueOnce(mockClient2);

      // Multiple calls should return same instance
      const client1 = getKintoneClient(config);
      const client2 = getKintoneClient(config);
      const client3 = getKintoneClient(config);

      expect(client1).toBe(client2);
      expect(client2).toBe(client3);
      expect(KintoneRestAPIClient).toHaveBeenCalledTimes(1);

      // After reset, new instance should be created
      resetKintoneClient();
      const client4 = getKintoneClient(config);

      expect(client4).not.toBe(client1);
      expect(KintoneRestAPIClient).toHaveBeenCalledTimes(2);
    });
  });
});
