import { describe, it, expect, beforeEach, vi } from "vitest";
import { getKintoneClient, resetKintoneClient } from "../client.js";
import type { KintoneClientConfig } from "../config/index.js";
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
    it("should return the same instance on subsequent calls", async () => {
      const config = { config: mockKintoneConfig, isApiTokenAuth: false };

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

    describe("authentication configuration", () => {
      const authTestCases = [
        {
          name: "should use username/password auth when provided",
          config: mockKintoneConfig,
          expectedAuth: {
            username: mockKintoneConfig.KINTONE_USERNAME,
            password: mockKintoneConfig.KINTONE_PASSWORD,
          },
        },
        {
          name: "should use API token auth when username/password not provided",
          config: mockKintoneConfigWithApiToken,
          expectedAuth: {
            apiToken: mockKintoneConfigWithApiToken.KINTONE_API_TOKEN,
          },
        },
        {
          name: "should prefer username/password over API token when both are provided",
          config: {
            ...mockKintoneConfig,
            KINTONE_API_TOKEN: "some-token",
          },
          expectedAuth: {
            username: mockKintoneConfig.KINTONE_USERNAME,
            password: mockKintoneConfig.KINTONE_PASSWORD,
          },
        },
        {
          name: "should handle API token auth with undefined username/password",
          config: {
            KINTONE_BASE_URL: "https://example.cybozu.com",
            KINTONE_API_TOKEN: "test-token",
          },
          expectedAuth: {
            apiToken: "test-token",
          },
        },
        {
          name: "should use API token with Basic auth",
          config: {
            ...mockKintoneConfigWithApiToken,
            KINTONE_BASIC_AUTH_USERNAME: "basic-user",
            KINTONE_BASIC_AUTH_PASSWORD: "basic-pass",
          },
          expectedAuth: {
            apiToken: mockKintoneConfigWithApiToken.KINTONE_API_TOKEN,
          },
          expectedBasicAuth: {
            username: "basic-user",
            password: "basic-pass",
          },
        },
        {
          name: "should handle empty string username/password as API token auth",
          config: {
            KINTONE_BASE_URL: "https://example.cybozu.com",
            KINTONE_API_TOKEN: "test-token",
            KINTONE_USERNAME: "",
            KINTONE_PASSWORD: "",
          },
          expectedAuth: {
            apiToken: "test-token",
          },
        },
        {
          name: "should handle only username provided (no password) as API token auth",
          config: {
            KINTONE_BASE_URL: "https://example.cybozu.com",
            KINTONE_API_TOKEN: "test-token",
            KINTONE_USERNAME: "testuser",
          },
          expectedAuth: {
            apiToken: "test-token",
          },
        },
      ];

      it.each(authTestCases)(
        "$name",
        async ({ config, expectedAuth, expectedBasicAuth }) => {
          const { KintoneRestAPIClient } = vi.mocked(
            await import("@kintone/rest-api-client"),
          );
          const mockClient = { app: { getApp: vi.fn() } };
          (KintoneRestAPIClient as any).mockReturnValue(mockClient);

          const isApiTokenAuth =
            !config.KINTONE_USERNAME || !config.KINTONE_PASSWORD;
          const client = getKintoneClient({
            config: config as KintoneClientConfig,
            isApiTokenAuth,
          });

          const expectedConfig: any = {
            baseUrl: config.KINTONE_BASE_URL,
            auth: expectedAuth,
            httpsAgent: expect.any(Object),
            userAgent: userAgentMatcher,
          };

          if (expectedBasicAuth) {
            expectedConfig.basicAuth = expectedBasicAuth;
          }

          expect(KintoneRestAPIClient).toHaveBeenCalledWith(expectedConfig);
          expect(client).toBe(mockClient);
        },
      );
    });

    describe("URL configuration", () => {
      const urlTestCases = [
        {
          name: "should handle config with URL containing path",
          baseUrl: "https://example.cybozu.com/k/",
        },
        {
          name: "should handle config with http protocol",
          baseUrl: "http://localhost:8080",
        },
      ];

      it.each(urlTestCases)("$name", async ({ baseUrl }) => {
        const configData = {
          ...mockKintoneConfig,
          KINTONE_BASE_URL: baseUrl,
        };

        const { KintoneRestAPIClient } = vi.mocked(
          await import("@kintone/rest-api-client"),
        );
        const mockClient = { app: { getApp: vi.fn() } };
        (KintoneRestAPIClient as any).mockReturnValue(mockClient);

        const client = getKintoneClient({
          config: configData,
          isApiTokenAuth: false,
        });

        expect(KintoneRestAPIClient).toHaveBeenCalledWith({
          baseUrl,
          auth: {
            username: mockKintoneConfig.KINTONE_USERNAME,
            password: mockKintoneConfig.KINTONE_PASSWORD,
          },
          httpsAgent: expect.any(Object),
          userAgent: userAgentMatcher,
        });
        expect(client).toBe(mockClient);
      });
    });
  });

  describe("singleton and reset behavior", () => {
    const singletonTestCases = [
      {
        name: "should reset the client instance with same config",
        config1: mockKintoneConfig,
        config2: mockKintoneConfig,
        shouldBeSameBeforeReset: true,
      },
      {
        name: "should allow creating new client with different config after reset",
        config1: {
          ...mockKintoneConfig,
          KINTONE_BASE_URL: "https://example1.cybozu.com",
        },
        config2: {
          ...mockKintoneConfig,
          KINTONE_BASE_URL: "https://example2.cybozu.com",
        },
        shouldBeSameBeforeReset: false,
      },
    ];

    it.each(singletonTestCases)(
      "$name",
      async ({ config1, config2, shouldBeSameBeforeReset }) => {
        const { KintoneRestAPIClient } = vi.mocked(
          await import("@kintone/rest-api-client"),
        );
        const mockClient1 = { app: { getApp: vi.fn() }, id: 1 };
        const mockClient2 = { app: { getApp: vi.fn() }, id: 2 };
        (KintoneRestAPIClient as any)
          .mockReturnValueOnce(mockClient1)
          .mockReturnValueOnce(mockClient2);

        const client1 = getKintoneClient({
          config: config1,
          isApiTokenAuth: false,
        });

        if (shouldBeSameBeforeReset) {
          // Test singleton behavior before reset
          const client1b = getKintoneClient({
            config: config1,
            isApiTokenAuth: false,
          });
          expect(client1).toBe(client1b);
          expect(KintoneRestAPIClient).toHaveBeenCalledTimes(1);
        }

        resetKintoneClient();
        const client2 = getKintoneClient({
          config: config2,
          isApiTokenAuth: false,
        });

        expect(client1).toBe(mockClient1);
        expect(client2).toBe(mockClient2);
        expect(client1).not.toBe(client2);
        expect(KintoneRestAPIClient).toHaveBeenCalledTimes(2);
      },
    );
  });

  describe("HTTPS Proxy and TLS configuration", () => {
    const proxyTestCases = [
      {
        name: "should use HttpsProxyAgent when HTTPS_PROXY is set",
        config: {
          ...mockKintoneConfig,
          HTTPS_PROXY: "http://proxy.example.com:8080",
        },
        expectedAgent: "HttpsProxyAgent",
        expectedAgentArgs: ["http://proxy.example.com:8080", {}],
        expectedHttpsAgent: {
          proxy: "http://proxy.example.com:8080",
          isProxyAgent: true,
        },
      },
      {
        name: "should use HttpsProxyAgent with PFX when both HTTPS_PROXY and PFX are set",
        config: {
          ...mockKintoneConfig,
          HTTPS_PROXY: "http://proxy.example.com:8080",
          KINTONE_PFX_FILE_PATH: "/path/to/cert.pfx",
          KINTONE_PFX_FILE_PASSWORD: "pfx-password",
        },
        expectedAgent: "HttpsProxyAgent",
        expectedAgentArgs: [
          "http://proxy.example.com:8080",
          {
            pfx: Buffer.from("mock-pfx-content"),
            passphrase: "pfx-password",
          },
        ],
        expectedHttpsAgent: {
          proxy: "http://proxy.example.com:8080",
          isProxyAgent: true,
        },
        expectsFileRead: true,
      },
      {
        name: "should use regular Agent with PFX when only PFX is set",
        config: {
          ...mockKintoneConfig,
          KINTONE_PFX_FILE_PATH: "/path/to/cert.pfx",
          KINTONE_PFX_FILE_PASSWORD: "pfx-password",
        },
        expectedAgent: "Agent",
        expectedAgentArgs: [
          {
            pfx: Buffer.from("mock-pfx-content"),
            passphrase: "pfx-password",
          },
        ],
        expectedHttpsAgent: {
          options: {
            pfx: Buffer.from("mock-pfx-content"),
            passphrase: "pfx-password",
          },
          isHttpsAgent: true,
        },
        expectsFileRead: true,
      },
      {
        name: "should use regular Agent when HTTPS_PROXY is not set",
        config: mockKintoneConfig,
        expectedAgent: "Agent",
        expectedAgentArgs: [{}],
        expectedHttpsAgent: { isHttpsAgent: true },
      },
      {
        name: "should handle empty string HTTPS_PROXY as no proxy",
        config: {
          ...mockKintoneConfig,
          HTTPS_PROXY: "",
        },
        expectedAgent: "Agent",
        expectedAgentArgs: [{}],
        expectedHttpsAgent: { isHttpsAgent: true },
      },
    ];

    it.each(proxyTestCases)(
      "$name",
      async ({
        config,
        expectedAgent,
        expectedAgentArgs,
        expectedHttpsAgent,
        expectsFileRead,
      }) => {
        const { KintoneRestAPIClient } = vi.mocked(
          await import("@kintone/rest-api-client"),
        );
        const { HttpsProxyAgent } = vi.mocked(
          await import("https-proxy-agent"),
        );
        const { Agent } = vi.mocked(await import("https"));
        const { readFileSync } = vi.mocked(await import("fs"));
        const mockClient = { app: { getApp: vi.fn() } };
        (KintoneRestAPIClient as any).mockReturnValue(mockClient);

        const client = getKintoneClient({ config, isApiTokenAuth: false });

        if (expectsFileRead) {
          expect(readFileSync).toHaveBeenCalledWith(
            config.KINTONE_PFX_FILE_PATH,
          );
        }

        if (expectedAgent === "HttpsProxyAgent") {
          expect(HttpsProxyAgent).toHaveBeenCalledWith(...expectedAgentArgs);
          expect(Agent).not.toHaveBeenCalled();
        } else {
          expect(Agent).toHaveBeenCalledWith(...expectedAgentArgs);
          expect(HttpsProxyAgent).not.toHaveBeenCalled();
        }

        const expectedConfig: any = {
          baseUrl: config.KINTONE_BASE_URL,
          auth: {
            username: mockKintoneConfig.KINTONE_USERNAME,
            password: mockKintoneConfig.KINTONE_PASSWORD,
          },
          httpsAgent: expect.objectContaining(expectedHttpsAgent),
          userAgent: userAgentMatcher,
        };

        if (config.KINTONE_BASIC_AUTH_USERNAME) {
          expectedConfig.basicAuth = {
            username: config.KINTONE_BASIC_AUTH_USERNAME,
            password: config.KINTONE_BASIC_AUTH_PASSWORD,
          };
        }

        expect(KintoneRestAPIClient).toHaveBeenCalledWith(expectedConfig);
        expect(client).toBe(mockClient);
      },
    );

    it("should handle different proxy URL formats", async () => {
      const proxyUrls = [
        "http://proxy.example.com:3128",
        "https://secure-proxy.example.com:443",
        "http://user:pass@proxy.example.com:8080",
      ];

      for (const proxyUrl of proxyUrls) {
        resetKintoneClient();
        vi.clearAllMocks();

        const configData = {
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

        getKintoneClient({ config: configData, isApiTokenAuth: false });

        expect(HttpsProxyAgent).toHaveBeenCalledWith(proxyUrl, {});
      }
    });
  });
});
