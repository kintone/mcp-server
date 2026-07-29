import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  mockKintoneConfig,
  mockKintoneConfigWithApiToken,
} from "../../__tests__/utils.js";
import type { KintoneClientConfig } from "../index.js";

// Mock constructors - vitest v4 requires class-based mocks for constructors
const mockKintoneClient = vi.fn();
vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: class {
    constructor(...args: unknown[]) {
      // コンストラクタの引数を記録（アサーション用）
      mockKintoneClient(...args);
      // mockReturnValue()で設定された値があれば返す
      const result = mockKintoneClient.mock.results.at(-1)?.value;
      if (result !== undefined) return result;
    }
  },
}));

const mockHttpsProxyAgent = vi.fn();
vi.mock("https-proxy-agent", () => ({
  HttpsProxyAgent: class {
    constructor(...args: unknown[]) {
      // コンストラクタの引数を記録（アサーション用）
      mockHttpsProxyAgent(...args);
      // mockReturnValue()で設定された値があれば返す
      const result = mockHttpsProxyAgent.mock.results.at(-1)?.value;
      if (result !== undefined) return result;
    }
  },
}));

// Mock fs
const mockReadFileSync = vi.fn().mockReturnValue(Buffer.from("mock-pfx-data"));
vi.mock("fs", () => ({
  readFileSync: mockReadFileSync,
}));

describe("createKintoneClient", () => {
  let createKintoneClient: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    // Import fresh module instance for each test
    const module = await import("../index.js");
    createKintoneClient = module.createKintoneClient;
  });

  describe("basic functionality", () => {
    it("should create KintoneRestAPIClient with correct configuration", () => {
      const mockClientInstance = { app: { getApp: vi.fn() } };
      mockKintoneClient.mockReturnValue(mockClientInstance);

      const result = createKintoneClient(mockKintoneConfig);

      expect(mockKintoneClient).toHaveBeenCalledWith({
        baseUrl: mockKintoneConfig.KINTONE_BASE_URL,
        auth: {
          username: mockKintoneConfig.KINTONE_USERNAME,
          password: mockKintoneConfig.KINTONE_PASSWORD,
        },
        userAgent: mockKintoneConfig.USER_AGENT,
        httpsAgent: expect.any(Object),
      });
      expect(result).toBe(mockClientInstance);
    });

    it("should create a new instance on each call", () => {
      const mockClientInstance1 = { app: { getApp: vi.fn() } };
      const mockClientInstance2 = { app: { getApp: vi.fn() } };
      mockKintoneClient
        .mockReturnValueOnce(mockClientInstance1)
        .mockReturnValueOnce(mockClientInstance2);

      const client1 = createKintoneClient(mockKintoneConfig);
      const client2 = createKintoneClient(mockKintoneConfig);

      expect(client1).toBe(mockClientInstance1);
      expect(client2).toBe(mockClientInstance2);
      expect(mockKintoneClient).toHaveBeenCalledTimes(2);
    });
  });

  describe("authentication configuration", () => {
    it("should use username/password auth when provided", () => {
      const mockClientInstance = { app: { getApp: vi.fn() } };
      mockKintoneClient.mockReturnValue(mockClientInstance);

      createKintoneClient(mockKintoneConfig);

      expect(mockKintoneClient).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: {
            username: mockKintoneConfig.KINTONE_USERNAME,
            password: mockKintoneConfig.KINTONE_PASSWORD,
          },
        }),
      );
    });

    it("should use API token auth when username/password not provided", () => {
      const mockClientInstance = { app: { getApp: vi.fn() } };
      mockKintoneClient.mockReturnValue(mockClientInstance);

      createKintoneClient(mockKintoneConfigWithApiToken);

      expect(mockKintoneClient).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: {
            apiToken: mockKintoneConfigWithApiToken.KINTONE_API_TOKEN,
          },
        }),
      );
    });

    it("should prefer username/password over API token when both provided", () => {
      const mockClientInstance = { app: { getApp: vi.fn() } };
      mockKintoneClient.mockReturnValue(mockClientInstance);

      const config: KintoneClientConfig = {
        ...mockKintoneConfig,
        KINTONE_API_TOKEN: "some-token",
      };

      createKintoneClient(config);

      expect(mockKintoneClient).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: {
            username: config.KINTONE_USERNAME,
            password: config.KINTONE_PASSWORD,
          },
        }),
      );
    });
  });

  describe("Basic Auth configuration", () => {
    it("should include Basic Auth when both username and password provided", () => {
      const mockClientInstance = { app: { getApp: vi.fn() } };
      mockKintoneClient.mockReturnValue(mockClientInstance);

      const config: KintoneClientConfig = {
        ...mockKintoneConfig,
        KINTONE_BASIC_AUTH_USERNAME: "basicuser",
        KINTONE_BASIC_AUTH_PASSWORD: "basicpass",
      };

      createKintoneClient(config);

      expect(mockKintoneClient).toHaveBeenCalledWith(
        expect.objectContaining({
          basicAuth: {
            username: "basicuser",
            password: "basicpass",
          },
        }),
      );
    });

    it("should not include Basic Auth when only username provided", () => {
      const mockClientInstance = { app: { getApp: vi.fn() } };
      mockKintoneClient.mockReturnValue(mockClientInstance);

      const config: KintoneClientConfig = {
        ...mockKintoneConfig,
        KINTONE_BASIC_AUTH_USERNAME: "basicuser",
        KINTONE_BASIC_AUTH_PASSWORD: undefined,
      };

      createKintoneClient(config);

      expect(mockKintoneClient).toHaveBeenCalledWith(
        expect.not.objectContaining({
          basicAuth: expect.anything(),
        }),
      );
    });
  });

  describe("HTTPS proxy configuration", () => {
    it("should create HttpsProxyAgent when HTTPS_PROXY provided", () => {
      const mockProxyAgent = { proxy: "test" };
      mockHttpsProxyAgent.mockReturnValue(mockProxyAgent);

      const mockClientInstance = { app: { getApp: vi.fn() } };
      mockKintoneClient.mockReturnValue(mockClientInstance);

      const config: KintoneClientConfig = {
        ...mockKintoneConfig,
        HTTPS_PROXY: "http://proxy.example.com:8080",
      };

      createKintoneClient(config);

      expect(mockHttpsProxyAgent).toHaveBeenCalledWith(
        "http://proxy.example.com:8080",
        {},
      );
      expect(mockKintoneClient).toHaveBeenCalledWith(
        expect.objectContaining({
          httpsAgent: mockProxyAgent,
        }),
      );
    });

    it("should create regular Agent when no proxy provided", () => {
      const mockClientInstance = { app: { getApp: vi.fn() } };
      mockKintoneClient.mockReturnValue(mockClientInstance);

      createKintoneClient(mockKintoneConfig);

      expect(mockKintoneClient).toHaveBeenCalledWith(
        expect.objectContaining({
          httpsAgent: expect.any(Object),
        }),
      );
    });
  });

  describe("PFX certificate configuration", () => {
    it("should read PFX file when path and password provided", () => {
      const mockClientInstance = { app: { getApp: vi.fn() } };
      mockKintoneClient.mockReturnValue(mockClientInstance);

      const config: KintoneClientConfig = {
        ...mockKintoneConfig,
        KINTONE_PFX_FILE_PATH: "/path/to/cert.pfx",
        KINTONE_PFX_FILE_PASSWORD: "pfx-password",
      };

      createKintoneClient(config);

      expect(mockReadFileSync).toHaveBeenCalledWith("/path/to/cert.pfx");
      expect(mockKintoneClient).toHaveBeenCalledWith(
        expect.objectContaining({
          httpsAgent: expect.any(Object),
        }),
      );
    });

    it("should throw error when PFX file reading fails", () => {
      mockReadFileSync.mockImplementationOnce(() => {
        throw new Error("File not found");
      });

      const config: KintoneClientConfig = {
        ...mockKintoneConfig,
        KINTONE_PFX_FILE_PATH: "/invalid/path.pfx",
        KINTONE_PFX_FILE_PASSWORD: "pfx-password",
      };

      expect(() => createKintoneClient(config)).toThrow(
        "Failed to read PFX file: /invalid/path.pfx. File not found",
      );
    });
  });

  describe("error handling", () => {
    it("should throw error when invalid proxy URL provided", () => {
      mockHttpsProxyAgent.mockImplementationOnce(() => {
        throw new Error("Invalid URL");
      });

      const config: KintoneClientConfig = {
        ...mockKintoneConfig,
        HTTPS_PROXY: "invalid-url",
      };

      expect(() => createKintoneClient(config)).toThrow(
        "Invalid HTTPS proxy URL: [invalid proxy URL]. Invalid URL",
      );
    });

    it("should mask credentials in error message when proxy URL contains username and password", () => {
      mockHttpsProxyAgent.mockImplementationOnce(() => {
        throw new Error("Connection refused");
      });

      const config: KintoneClientConfig = {
        ...mockKintoneConfig,
        HTTPS_PROXY: "http://user:pass@proxy.example.com:8080",
      };

      expect(() => createKintoneClient(config)).toThrow(
        "Invalid HTTPS proxy URL: http://proxy.example.com:8080/. Connection refused",
      );
    });
  });
});
