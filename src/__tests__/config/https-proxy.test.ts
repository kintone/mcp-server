import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { parseKintoneClientConfig } from "../../config.js";
import { mockKintoneConfig } from "../utils.js";

describe("config - HTTPS_PROXY configuration", () => {
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
      checkUndefined: "HTTPS_PROXY",
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
      checkEmptyString: "HTTPS_PROXY",
    },
  ])("$name", ({ env, expected, checkUndefined, checkEmptyString }) => {
    process.env = {
      ...originalEnv,
      ...env,
    };

    const config = parseKintoneClientConfig();

    expect(config).toEqual(expected);

    if (checkUndefined) {
      expect(config[checkUndefined]).toBeUndefined();
    }

    if (checkEmptyString) {
      expect(config[checkEmptyString]).toBe("");
    }
  });

  it.each([
    "http://proxy.example.com:3128",
    "https://secure-proxy.example.com:443",
    "http://user:pass@proxy.example.com:8080",
  ])("should accept various proxy URL formats: %s", (proxyUrl) => {
    process.env = {
      ...originalEnv,
      ...mockKintoneConfig,
      HTTPS_PROXY: proxyUrl,
    };

    const config = parseKintoneClientConfig();

    expect(config.HTTPS_PROXY).toBe(proxyUrl);
  });
});
