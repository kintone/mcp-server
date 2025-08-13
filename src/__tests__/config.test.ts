import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { parseKintoneClientConfig } from "../config.js";
import { mockKintoneConfig } from "./utils.js";

describe("config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe("parseKintoneClientConfig", () => {
    describe("successful parsing", () => {
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
      ])("$name", ({ env, expected }) => {
        process.env = {
          ...originalEnv,
          ...env,
        };

        const config = parseKintoneClientConfig();

        expect(config).toEqual(expected);
      });
    });

    describe("validation errors", () => {
      it.each([
        {
          name: "should throw error when KINTONE_BASE_URL is missing",
          env: {
            KINTONE_USERNAME: mockKintoneConfig.KINTONE_USERNAME,
            KINTONE_PASSWORD: mockKintoneConfig.KINTONE_PASSWORD,
          },
          expectedErrors: [
            "Environment variables are missing or invalid",
            "KINTONE_BASE_URL: Required",
          ],
        },
        {
          name: "should throw error when KINTONE_BASE_URL is invalid",
          env: {
            ...mockKintoneConfig,
            KINTONE_BASE_URL: "not-a-url",
          },
          expectedErrors: [
            "Environment variables are missing or invalid",
            "KINTONE_BASE_URL: Invalid url",
          ],
        },
        {
          name: "should throw error when KINTONE_BASE_URL is empty",
          env: {
            ...mockKintoneConfig,
            KINTONE_BASE_URL: "",
          },
          expectedErrors: [
            "Environment variables are missing or invalid",
            "KINTONE_BASE_URL: Invalid url",
          ],
        },
        {
          name: "should throw error when KINTONE_USERNAME is missing",
          env: {
            KINTONE_BASE_URL: mockKintoneConfig.KINTONE_BASE_URL,
            KINTONE_PASSWORD: mockKintoneConfig.KINTONE_PASSWORD,
          },
          expectedErrors: [
            "Environment variables are missing or invalid",
            "KINTONE_USERNAME: Required",
          ],
        },
        {
          name: "should throw error when KINTONE_USERNAME is empty",
          env: {
            ...mockKintoneConfig,
            KINTONE_USERNAME: "",
          },
          expectedErrors: [
            "Environment variables are missing or invalid",
            "KINTONE_USERNAME: String must contain at least 1 character(s)",
          ],
        },
        {
          name: "should throw error when KINTONE_PASSWORD is missing",
          env: {
            KINTONE_BASE_URL: mockKintoneConfig.KINTONE_BASE_URL,
            KINTONE_USERNAME: mockKintoneConfig.KINTONE_USERNAME,
          },
          expectedErrors: [
            "Environment variables are missing or invalid",
            "KINTONE_PASSWORD: Required",
          ],
        },
        {
          name: "should throw error when KINTONE_PASSWORD is empty",
          env: {
            ...mockKintoneConfig,
            KINTONE_PASSWORD: "",
          },
          expectedErrors: [
            "Environment variables are missing or invalid",
            "KINTONE_PASSWORD: String must contain at least 1 character(s)",
          ],
        },
        {
          name: "should report multiple validation errors",
          env: {
            KINTONE_BASE_URL: "invalid-url",
            KINTONE_USERNAME: "",
            KINTONE_PASSWORD: "",
          },
          expectedErrors: [
            "Environment variables are missing or invalid",
            "KINTONE_BASE_URL: Invalid url",
            "KINTONE_USERNAME: String must contain at least 1 character(s)",
            "KINTONE_PASSWORD: String must contain at least 1 character(s)",
          ],
        },
        {
          name: "should report all missing environment variables",
          env: {},
          expectedErrors: [
            "Environment variables are missing or invalid",
            "KINTONE_BASE_URL: Required",
            "KINTONE_USERNAME: Required",
            "KINTONE_PASSWORD: Required",
          ],
          deleteEnvVars: true,
        },
      ])("$name", ({ env, expectedErrors, deleteEnvVars }) => {
        process.env = {
          ...originalEnv,
          ...env,
        };

        if (deleteEnvVars) {
          delete process.env.KINTONE_BASE_URL;
          delete process.env.KINTONE_USERNAME;
          delete process.env.KINTONE_PASSWORD;
        }

        const errorCall = () => parseKintoneClientConfig();
        expectedErrors.forEach((error) => {
          expect(errorCall).toThrow(error);
        });
      });
    });

    describe("HTTPS_PROXY configuration", () => {
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
  });
});
