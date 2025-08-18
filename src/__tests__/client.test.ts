import { describe, it, expect, beforeEach, vi } from "vitest";
import { getKintoneClient, resetKintoneClient } from "../client.js";
import type { KintoneClientConfig } from "../config.js";
import { mockKintoneConfig, mockKintoneConfigWithApiToken } from "./utils.js";

// Mock the KintoneRestAPIClient
vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: vi.fn(),
}));

// Mock https-proxy-agent
vi.mock("https-proxy-agent", () => ({
  HttpsProxyAgent: vi.fn().mockImplementation((url, options) => ({
    proxy: url,
    options,
    isProxyAgent: true,
  })),
}));

// Mock https Agent
vi.mock("https", () => ({
  Agent: vi
    .fn()
    .mockImplementation((options) => ({ options, isHttpsAgent: true })),
}));

// Mock fs
vi.mock("fs", () => ({
  readFileSync: vi.fn().mockReturnValue(Buffer.from("mock-pfx-content")),
}));

// Common matcher for userAgent field
const userAgentMatcher = expect.stringMatching(
  /^@kintone\/mcp-server@\d+\.\d+\.\d+$/,
);

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
        httpsAgent: expect.any(Object),
        userAgent: userAgentMatcher,
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
        httpsAgent: expect.any(Object),
        userAgent: userAgentMatcher,
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
        httpsAgent: expect.any(Object),
        userAgent: userAgentMatcher,
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
        httpsAgent: expect.any(Object),
        userAgent: userAgentMatcher,
      });
    });

    it("should use API token authentication when provided", async () => {
      const config = mockKintoneConfigWithApiToken;

      const { KintoneRestAPIClient } = vi.mocked(
        await import("@kintone/rest-api-client"),
      );
      const mockClient = { app: { getApp: vi.fn() } };
      (KintoneRestAPIClient as any).mockReturnValue(mockClient);

      const client = getKintoneClient(config);

      expect(KintoneRestAPIClient).toHaveBeenCalledWith({
        baseUrl: mockKintoneConfigWithApiToken.KINTONE_BASE_URL,
        auth: {
          apiToken: "token1,token2,token3",
        },
        httpsAgent: expect.any(Object),
      });
      expect(client).toBe(mockClient);
    });

    it("should use API token with Basic auth", async () => {
      const config = {
        ...mockKintoneConfigWithApiToken,
        KINTONE_BASIC_AUTH_USERNAME: "basic-user",
        KINTONE_BASIC_AUTH_PASSWORD: "basic-pass",
      };

      const { KintoneRestAPIClient } = vi.mocked(
        await import("@kintone/rest-api-client"),
      );
      const mockClient = { app: { getApp: vi.fn() } };
      (KintoneRestAPIClient as any).mockReturnValue(mockClient);

      const client = getKintoneClient(config);

      expect(KintoneRestAPIClient).toHaveBeenCalledWith({
        baseUrl: mockKintoneConfigWithApiToken.KINTONE_BASE_URL,
        auth: {
          apiToken: "token1,token2,token3",
        },
        basicAuth: {
          username: "basic-user",
          password: "basic-pass",
        },
        httpsAgent: expect.any(Object),
      });
      expect(client).toBe(mockClient);
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
        httpsAgent: expect.any(Object),
        userAgent: userAgentMatcher,
      });

      resetKintoneClient();

      const client2 = getKintoneClient(config2);
      expect(KintoneRestAPIClient).toHaveBeenCalledWith({
        baseUrl: "https://example2.cybozu.com",
        auth: {
          username: mockKintoneConfig.KINTONE_USERNAME,
          password: mockKintoneConfig.KINTONE_PASSWORD,
        },
        httpsAgent: expect.any(Object),
        userAgent: userAgentMatcher,
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

  describe("HTTPS Proxy support", () => {
    describe("getKintoneClient with HTTPS_PROXY", () => {
      it("should use HttpsProxyAgent when HTTPS_PROXY is set", async () => {
        const config = {
          ...mockKintoneConfig,
          HTTPS_PROXY: "http://proxy.example.com:8080",
        };

        const { KintoneRestAPIClient } = vi.mocked(
          await import("@kintone/rest-api-client"),
        );
        const { HttpsProxyAgent } = vi.mocked(
          await import("https-proxy-agent"),
        );
        const mockClient = { app: { getApp: vi.fn() } };
        (KintoneRestAPIClient as any).mockReturnValue(mockClient);

        const client = getKintoneClient(config);

        expect(HttpsProxyAgent).toHaveBeenCalledWith(
          "http://proxy.example.com:8080",
          {},
        );
        expect(KintoneRestAPIClient).toHaveBeenCalledWith({
          baseUrl: mockKintoneConfig.KINTONE_BASE_URL,
          auth: {
            username: mockKintoneConfig.KINTONE_USERNAME,
            password: mockKintoneConfig.KINTONE_PASSWORD,
          },
          httpsAgent: expect.objectContaining({
            proxy: "http://proxy.example.com:8080",
            isProxyAgent: true,
          }),
          userAgent: userAgentMatcher,
        });
        expect(client).toBe(mockClient);
      });

      it("should include Basic auth when credentials are provided", async () => {
        const config = {
          ...mockKintoneConfig,
          KINTONE_BASIC_AUTH_USERNAME: "basic-user",
          KINTONE_BASIC_AUTH_PASSWORD: "basic-pass",
        };

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
          basicAuth: {
            username: "basic-user",
            password: "basic-pass",
          },
          httpsAgent: expect.any(Object),
          userAgent: userAgentMatcher,
        });
        expect(client).toBe(mockClient);
      });

      it("should use HttpsProxyAgent with PFX when both HTTPS_PROXY and PFX are set", async () => {
        const config = {
          ...mockKintoneConfig,
          HTTPS_PROXY: "http://proxy.example.com:8080",
          KINTONE_PFX_FILE_PATH: "/path/to/cert.pfx",
          KINTONE_PFX_FILE_PASSWORD: "pfx-password",
        };

        const { KintoneRestAPIClient } = vi.mocked(
          await import("@kintone/rest-api-client"),
        );
        const { HttpsProxyAgent } = vi.mocked(
          await import("https-proxy-agent"),
        );
        const { readFileSync } = vi.mocked(await import("fs"));
        const mockClient = { app: { getApp: vi.fn() } };
        (KintoneRestAPIClient as any).mockReturnValue(mockClient);

        const client = getKintoneClient(config);

        expect(readFileSync).toHaveBeenCalledWith("/path/to/cert.pfx");
        expect(HttpsProxyAgent).toHaveBeenCalledWith(
          "http://proxy.example.com:8080",
          {
            pfx: Buffer.from("mock-pfx-content"),
            passphrase: "pfx-password",
          },
        );
        expect(KintoneRestAPIClient).toHaveBeenCalledWith({
          baseUrl: mockKintoneConfig.KINTONE_BASE_URL,
          auth: {
            username: mockKintoneConfig.KINTONE_USERNAME,
            password: mockKintoneConfig.KINTONE_PASSWORD,
          },
          httpsAgent: expect.objectContaining({
            proxy: "http://proxy.example.com:8080",
            isProxyAgent: true,
          }),
          userAgent: userAgentMatcher,
        });
        expect(client).toBe(mockClient);
      });

      it("should use regular Agent with PFX when only PFX is set", async () => {
        const config = {
          ...mockKintoneConfig,
          KINTONE_PFX_FILE_PATH: "/path/to/cert.pfx",
          KINTONE_PFX_FILE_PASSWORD: "pfx-password",
        };

        const { KintoneRestAPIClient } = vi.mocked(
          await import("@kintone/rest-api-client"),
        );
        const { Agent } = vi.mocked(await import("https"));
        const { readFileSync } = vi.mocked(await import("fs"));
        const mockClient = { app: { getApp: vi.fn() } };
        (KintoneRestAPIClient as any).mockReturnValue(mockClient);

        const client = getKintoneClient(config);

        expect(readFileSync).toHaveBeenCalledWith("/path/to/cert.pfx");
        expect(Agent).toHaveBeenCalledWith({
          pfx: Buffer.from("mock-pfx-content"),
          passphrase: "pfx-password",
        });
        expect(KintoneRestAPIClient).toHaveBeenCalledWith({
          baseUrl: mockKintoneConfig.KINTONE_BASE_URL,
          auth: {
            username: mockKintoneConfig.KINTONE_USERNAME,
            password: mockKintoneConfig.KINTONE_PASSWORD,
          },
          httpsAgent: expect.objectContaining({
            options: {
              pfx: Buffer.from("mock-pfx-content"),
              passphrase: "pfx-password",
            },
            isHttpsAgent: true,
          }),
          userAgent: userAgentMatcher,
        });
        expect(client).toBe(mockClient);
      });

      it("should use regular Agent when HTTPS_PROXY is not set", async () => {
        const config = mockKintoneConfig;

        const { KintoneRestAPIClient } = vi.mocked(
          await import("@kintone/rest-api-client"),
        );
        const { Agent } = vi.mocked(await import("https"));
        const { HttpsProxyAgent } = vi.mocked(
          await import("https-proxy-agent"),
        );
        const mockClient = { app: { getApp: vi.fn() } };
        (KintoneRestAPIClient as any).mockReturnValue(mockClient);

        const client = getKintoneClient(config);

        expect(Agent).toHaveBeenCalledWith({});
        expect(HttpsProxyAgent).not.toHaveBeenCalled();
        expect(KintoneRestAPIClient).toHaveBeenCalledWith({
          baseUrl: mockKintoneConfig.KINTONE_BASE_URL,
          auth: {
            username: mockKintoneConfig.KINTONE_USERNAME,
            password: mockKintoneConfig.KINTONE_PASSWORD,
          },
          httpsAgent: expect.objectContaining({ isHttpsAgent: true }),
          userAgent: userAgentMatcher,
        });
        expect(client).toBe(mockClient);
      });

      it("should handle different proxy URL formats", async () => {
        const testCases = [
          "http://proxy.example.com:3128",
          "https://secure-proxy.example.com:443",
          "http://user:pass@proxy.example.com:8080",
        ];

        for (const proxyUrl of testCases) {
          resetKintoneClient();
          vi.clearAllMocks();

          const config = {
            ...mockKintoneConfig,
            HTTPS_PROXY: proxyUrl,
          };

          const { KintoneRestAPIClient } = vi.mocked(
            await import("@kintone/rest-api-client"),
          );
          const { HttpsProxyAgent } = vi.mocked(
            await import("https-proxy-agent"),
          );
          const mockClient = { app: { getApp: vi.fn() } };
          (KintoneRestAPIClient as any).mockReturnValue(mockClient);

          getKintoneClient(config);

          expect(HttpsProxyAgent).toHaveBeenCalledWith(proxyUrl, {});
          expect(KintoneRestAPIClient).toHaveBeenCalledWith({
            baseUrl: mockKintoneConfig.KINTONE_BASE_URL,
            auth: {
              username: mockKintoneConfig.KINTONE_USERNAME,
              password: mockKintoneConfig.KINTONE_PASSWORD,
            },
            httpsAgent: expect.objectContaining({
              proxy: proxyUrl,
              isProxyAgent: true,
            }),
            userAgent: userAgentMatcher,
          });
        }
      });

      it("should handle empty string HTTPS_PROXY as no proxy", async () => {
        const config = {
          ...mockKintoneConfig,
          HTTPS_PROXY: "",
        };

        const { KintoneRestAPIClient } = vi.mocked(
          await import("@kintone/rest-api-client"),
        );
        const { Agent } = vi.mocked(await import("https"));
        const { HttpsProxyAgent } = vi.mocked(
          await import("https-proxy-agent"),
        );
        const mockClient = { app: { getApp: vi.fn() } };
        (KintoneRestAPIClient as any).mockReturnValue(mockClient);

        const client = getKintoneClient(config);

        expect(Agent).toHaveBeenCalledWith({});
        expect(HttpsProxyAgent).not.toHaveBeenCalled();
        expect(KintoneRestAPIClient).toHaveBeenCalledWith({
          baseUrl: mockKintoneConfig.KINTONE_BASE_URL,
          auth: {
            username: mockKintoneConfig.KINTONE_USERNAME,
            password: mockKintoneConfig.KINTONE_PASSWORD,
          },
          httpsAgent: expect.objectContaining({ isHttpsAgent: true }),
          userAgent: userAgentMatcher,
        });
        expect(client).toBe(mockClient);
      });

      it("should maintain singleton behavior with proxy settings", async () => {
        const config = {
          ...mockKintoneConfig,
          HTTPS_PROXY: "http://proxy.example.com:8080",
        };

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

      it("should create new client with different proxy after reset", async () => {
        const config1 = {
          ...mockKintoneConfig,
          HTTPS_PROXY: "http://proxy1.example.com:8080",
        };
        const config2 = {
          ...mockKintoneConfig,
          HTTPS_PROXY: "http://proxy2.example.com:3128",
        };

        const { KintoneRestAPIClient } = vi.mocked(
          await import("@kintone/rest-api-client"),
        );
        const { HttpsProxyAgent } = vi.mocked(
          await import("https-proxy-agent"),
        );
        const mockClient1 = { app: { getApp: vi.fn() }, id: 1 };
        const mockClient2 = { app: { getApp: vi.fn() }, id: 2 };
        (KintoneRestAPIClient as any)
          .mockReturnValueOnce(mockClient1)
          .mockReturnValueOnce(mockClient2);

        const client1 = getKintoneClient(config1);
        expect(HttpsProxyAgent).toHaveBeenCalledWith(
          "http://proxy1.example.com:8080",
          {},
        );

        resetKintoneClient();
        vi.clearAllMocks();

        const client2 = getKintoneClient(config2);
        expect(HttpsProxyAgent).toHaveBeenCalledWith(
          "http://proxy2.example.com:3128",
          {},
        );

        expect(client1).not.toBe(client2);
      });
    });
  });
});
