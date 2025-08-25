import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { parseKintoneClientConfig } from "../index.js";
import { mockKintoneConfig } from "../../__tests__/utils.js";

describe("config - successful parsing", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  it.each([
    {
      name: "should parse valid environment variables",
      env: mockKintoneConfig,
      expected: mockKintoneConfig,
    },
    {
      name: "should accept different valid URLs",
      env: {
        ...mockKintoneConfig,
        KINTONE_BASE_URL: "https://custom.kintone.com",
      },
      expected: {
        ...mockKintoneConfig,
        KINTONE_BASE_URL: "https://custom.kintone.com",
      },
    },
    {
      name: "should accept URLs with paths",
      env: {
        ...mockKintoneConfig,
        KINTONE_BASE_URL: "https://example.cybozu.com/k/",
      },
      expected: {
        ...mockKintoneConfig,
        KINTONE_BASE_URL: "https://example.cybozu.com/k/",
      },
    },
    {
      name: "should accept http URLs",
      env: {
        ...mockKintoneConfig,
        KINTONE_BASE_URL: "http://localhost:8080",
      },
      expected: {
        ...mockKintoneConfig,
        KINTONE_BASE_URL: "http://localhost:8080",
      },
    },
    {
      name: "should accept very long passwords",
      env: (() => {
        const longPassword = "a".repeat(1000);
        return {
          ...mockKintoneConfig,
          KINTONE_PASSWORD: longPassword,
        };
      })(),
      expected: (() => {
        const longPassword = "a".repeat(1000);
        return {
          ...mockKintoneConfig,
          KINTONE_PASSWORD: longPassword,
        };
      })(),
    },
    {
      name: "should ignore extra environment variables",
      env: {
        ...mockKintoneConfig,
        OTHER_VAR: "should be ignored",
      },
      expected: mockKintoneConfig,
    },
    {
      name: "should parse HTTPS_PROXY when provided",
      env: {
        ...mockKintoneConfig,
        HTTPS_PROXY: "http://proxy.example.com:8080",
      },
      expected: {
        ...mockKintoneConfig,
        HTTPS_PROXY: "http://proxy.example.com:8080",
      },
    },
    {
      name: "should work without HTTPS_PROXY (optional field)",
      env: mockKintoneConfig,
      expected: mockKintoneConfig,
    },
    {
      name: "should handle empty HTTPS_PROXY as empty string",
      env: {
        ...mockKintoneConfig,
        HTTPS_PROXY: "",
      },
      expected: {
        ...mockKintoneConfig,
        HTTPS_PROXY: "",
      },
    },
    {
      name: "should accept various proxy URL formats",
      env: {
        ...mockKintoneConfig,
        HTTPS_PROXY: "http://user:pass@proxy.example.com:8080",
      },
      expected: {
        ...mockKintoneConfig,
        HTTPS_PROXY: "http://user:pass@proxy.example.com:8080",
      },
    },
    {
      name: "should parse PFX file settings when both are provided",
      env: {
        ...mockKintoneConfig,
        KINTONE_PFX_FILE_PATH: "/path/to/cert.pfx",
        KINTONE_PFX_FILE_PASSWORD: "pfx-password",
      },
      expected: {
        ...mockKintoneConfig,
        KINTONE_PFX_FILE_PATH: "/path/to/cert.pfx",
        KINTONE_PFX_FILE_PASSWORD: "pfx-password",
      },
    },
    {
      name: "should parse with PFX settings and HTTPS proxy",
      env: {
        ...mockKintoneConfig,
        HTTPS_PROXY: "http://proxy.example.com:8080",
        KINTONE_PFX_FILE_PATH: "/path/to/cert.pfx",
        KINTONE_PFX_FILE_PASSWORD: "pfx-password",
      },
      expected: {
        ...mockKintoneConfig,
        HTTPS_PROXY: "http://proxy.example.com:8080",
        KINTONE_PFX_FILE_PATH: "/path/to/cert.pfx",
        KINTONE_PFX_FILE_PASSWORD: "pfx-password",
      },
    },
    {
      name: "should parse Basic auth settings when both are provided",
      env: {
        ...mockKintoneConfig,
        KINTONE_BASIC_AUTH_USERNAME: "basic-user",
        KINTONE_BASIC_AUTH_PASSWORD: "basic-pass",
      },
      expected: {
        ...mockKintoneConfig,
        KINTONE_BASIC_AUTH_USERNAME: "basic-user",
        KINTONE_BASIC_AUTH_PASSWORD: "basic-pass",
      },
    },
    {
      name: "should work without Basic auth (optional fields)",
      env: mockKintoneConfig,
      expected: mockKintoneConfig,
    },
    {
      name: "should parse with API token instead of username/password",
      env: {
        KINTONE_BASE_URL: "https://example.cybozu.com",
        KINTONE_API_TOKEN: "abc123",
      },
      expected: {
        KINTONE_BASE_URL: "https://example.cybozu.com",
        KINTONE_API_TOKEN: "abc123",
        KINTONE_USERNAME: undefined,
        KINTONE_PASSWORD: undefined,
        KINTONE_BASIC_AUTH_USERNAME: undefined,
        KINTONE_BASIC_AUTH_PASSWORD: undefined,
        HTTPS_PROXY: undefined,
        KINTONE_PFX_FILE_PATH: undefined,
        KINTONE_PFX_FILE_PASSWORD: undefined,
      },
    },
    {
      name: "should parse multiple API tokens (comma-separated)",
      env: {
        KINTONE_BASE_URL: "https://example.cybozu.com",
        KINTONE_API_TOKEN: "token1,token2,token3",
      },
      expected: {
        KINTONE_BASE_URL: "https://example.cybozu.com",
        KINTONE_API_TOKEN: "token1,token2,token3",
        KINTONE_USERNAME: undefined,
        KINTONE_PASSWORD: undefined,
        KINTONE_BASIC_AUTH_USERNAME: undefined,
        KINTONE_BASIC_AUTH_PASSWORD: undefined,
        HTTPS_PROXY: undefined,
        KINTONE_PFX_FILE_PATH: undefined,
        KINTONE_PFX_FILE_PASSWORD: undefined,
      },
    },
    {
      name: "should accept up to 9 API tokens",
      env: {
        KINTONE_BASE_URL: "https://example.cybozu.com",
        KINTONE_API_TOKEN: "t1,t2,t3,t4,t5,t6,t7,t8,t9",
      },
      expected: {
        KINTONE_BASE_URL: "https://example.cybozu.com",
        KINTONE_API_TOKEN: "t1,t2,t3,t4,t5,t6,t7,t8,t9",
        KINTONE_USERNAME: undefined,
        KINTONE_PASSWORD: undefined,
        KINTONE_BASIC_AUTH_USERNAME: undefined,
        KINTONE_BASIC_AUTH_PASSWORD: undefined,
        HTTPS_PROXY: undefined,
        KINTONE_PFX_FILE_PATH: undefined,
        KINTONE_PFX_FILE_PASSWORD: undefined,
      },
    },
    {
      name: "should handle API tokens with spaces around commas",
      env: {
        KINTONE_BASE_URL: "https://example.cybozu.com",
        KINTONE_API_TOKEN: "token1 , token2 , token3",
      },
      expected: {
        KINTONE_BASE_URL: "https://example.cybozu.com",
        KINTONE_API_TOKEN: "token1 , token2 , token3",
        KINTONE_USERNAME: undefined,
        KINTONE_PASSWORD: undefined,
        KINTONE_BASIC_AUTH_USERNAME: undefined,
        KINTONE_BASIC_AUTH_PASSWORD: undefined,
        HTTPS_PROXY: undefined,
        KINTONE_PFX_FILE_PATH: undefined,
        KINTONE_PFX_FILE_PASSWORD: undefined,
      },
    },
  ])("$name", ({ env, expected }) => {
    process.env = {
      ...originalEnv,
      ...env,
    };

    const result = parseKintoneClientConfig();

    expect(result.config).toEqual(expected);
    expect(result.isApiTokenAuth).toBe(
      !(expected.KINTONE_USERNAME && expected.KINTONE_PASSWORD),
    );
  });
});
