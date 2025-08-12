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
      it("should parse valid environment variables", () => {
        process.env = {
          ...originalEnv,
          ...mockKintoneConfig,
        };

        const config = parseKintoneClientConfig();

        expect(config).toEqual(mockKintoneConfig);
      });

      it("should accept different valid URLs", () => {
        process.env = {
          ...originalEnv,
          ...mockKintoneConfig,
          KINTONE_BASE_URL: "https://custom.kintone.com",
        };

        const config = parseKintoneClientConfig();

        expect(config).toEqual({
          ...mockKintoneConfig,
          KINTONE_BASE_URL: "https://custom.kintone.com",
        });
      });

      it("should accept URLs with paths", () => {
        process.env = {
          ...originalEnv,
          ...mockKintoneConfig,
          KINTONE_BASE_URL: "https://example.cybozu.com/k/",
        };

        const config = parseKintoneClientConfig();

        expect(config).toEqual({
          ...mockKintoneConfig,
          KINTONE_BASE_URL: "https://example.cybozu.com/k/",
        });
      });
    });

    describe("validation errors", () => {
      it("should throw error when KINTONE_BASE_URL is missing", () => {
        process.env = {
          ...originalEnv,
          KINTONE_USERNAME: mockKintoneConfig.KINTONE_USERNAME,
          KINTONE_PASSWORD: mockKintoneConfig.KINTONE_PASSWORD,
        };

        expect(() => parseKintoneClientConfig()).toThrow(
          "Environment variables are missing or invalid",
        );
        expect(() => parseKintoneClientConfig()).toThrow(
          "KINTONE_BASE_URL: Required",
        );
      });

      it("should throw error when KINTONE_BASE_URL is invalid", () => {
        process.env = {
          ...originalEnv,
          ...mockKintoneConfig,
          KINTONE_BASE_URL: "not-a-url",
        };

        expect(() => parseKintoneClientConfig()).toThrow(
          "Environment variables are missing or invalid",
        );
        expect(() => parseKintoneClientConfig()).toThrow(
          "KINTONE_BASE_URL: Invalid url",
        );
      });

      it("should throw error when KINTONE_BASE_URL is empty", () => {
        process.env = {
          ...originalEnv,
          ...mockKintoneConfig,
          KINTONE_BASE_URL: "",
        };

        expect(() => parseKintoneClientConfig()).toThrow(
          "Environment variables are missing or invalid",
        );
        expect(() => parseKintoneClientConfig()).toThrow(
          "KINTONE_BASE_URL: Invalid url",
        );
      });

      it("should throw error when KINTONE_USERNAME is missing", () => {
        process.env = {
          ...originalEnv,
          KINTONE_BASE_URL: mockKintoneConfig.KINTONE_BASE_URL,
          KINTONE_PASSWORD: mockKintoneConfig.KINTONE_PASSWORD,
        };

        expect(() => parseKintoneClientConfig()).toThrow(
          "Environment variables are missing or invalid",
        );
        expect(() => parseKintoneClientConfig()).toThrow(
          "KINTONE_USERNAME: Required",
        );
      });

      it("should throw error when KINTONE_USERNAME is empty", () => {
        process.env = {
          ...originalEnv,
          ...mockKintoneConfig,
          KINTONE_USERNAME: "",
        };

        expect(() => parseKintoneClientConfig()).toThrow(
          "Environment variables are missing or invalid",
        );
        expect(() => parseKintoneClientConfig()).toThrow(
          "KINTONE_USERNAME: String must contain at least 1 character(s)",
        );
      });

      it("should throw error when KINTONE_PASSWORD is missing", () => {
        process.env = {
          ...originalEnv,
          KINTONE_BASE_URL: mockKintoneConfig.KINTONE_BASE_URL,
          KINTONE_USERNAME: mockKintoneConfig.KINTONE_USERNAME,
        };

        expect(() => parseKintoneClientConfig()).toThrow(
          "Environment variables are missing or invalid",
        );
        expect(() => parseKintoneClientConfig()).toThrow(
          "KINTONE_PASSWORD: Required",
        );
      });

      it("should throw error when KINTONE_PASSWORD is empty", () => {
        process.env = {
          ...originalEnv,
          ...mockKintoneConfig,
          KINTONE_PASSWORD: "",
        };

        expect(() => parseKintoneClientConfig()).toThrow(
          "Environment variables are missing or invalid",
        );
        expect(() => parseKintoneClientConfig()).toThrow(
          "KINTONE_PASSWORD: String must contain at least 1 character(s)",
        );
      });

      it("should report multiple validation errors", () => {
        process.env = {
          ...originalEnv,
          KINTONE_BASE_URL: "invalid-url",
          KINTONE_USERNAME: "",
          KINTONE_PASSWORD: "",
        };

        const errorCall = () => parseKintoneClientConfig();
        expect(errorCall).toThrow(
          "Environment variables are missing or invalid",
        );
        expect(errorCall).toThrow("KINTONE_BASE_URL: Invalid url");
        expect(errorCall).toThrow(
          "KINTONE_USERNAME: String must contain at least 1 character(s)",
        );
        expect(errorCall).toThrow(
          "KINTONE_PASSWORD: String must contain at least 1 character(s)",
        );
      });

      it("should report all missing environment variables", () => {
        process.env = { ...originalEnv };
        // Remove all kintone-related env vars
        delete process.env.KINTONE_BASE_URL;
        delete process.env.KINTONE_USERNAME;
        delete process.env.KINTONE_PASSWORD;

        const errorCall = () => parseKintoneClientConfig();
        expect(errorCall).toThrow(
          "Environment variables are missing or invalid",
        );
        expect(errorCall).toThrow("KINTONE_BASE_URL: Required");
        expect(errorCall).toThrow("KINTONE_USERNAME: Required");
        expect(errorCall).toThrow("KINTONE_PASSWORD: Required");
      });
    });

    describe("HTTPS_PROXY configuration", () => {
      it("should parse HTTPS_PROXY when provided", () => {
        process.env = {
          ...originalEnv,
          ...mockKintoneConfig,
          HTTPS_PROXY: "http://proxy.example.com:8080",
        };

        const config = parseKintoneClientConfig();

        expect(config).toEqual({
          ...mockKintoneConfig,
          HTTPS_PROXY: "http://proxy.example.com:8080",
        });
      });

      it("should work without HTTPS_PROXY (optional field)", () => {
        process.env = {
          ...originalEnv,
          ...mockKintoneConfig,
        };

        const config = parseKintoneClientConfig();

        expect(config).toEqual(mockKintoneConfig);
        expect(config.HTTPS_PROXY).toBeUndefined();
      });

      it("should handle empty HTTPS_PROXY as empty string", () => {
        process.env = {
          ...originalEnv,
          ...mockKintoneConfig,
          HTTPS_PROXY: "",
        };

        const config = parseKintoneClientConfig();

        expect(config).toEqual({
          ...mockKintoneConfig,
          HTTPS_PROXY: "",
        });
        expect(config.HTTPS_PROXY).toBe("");
      });

      it("should accept various proxy URL formats", () => {
        const proxyUrls = [
          "http://proxy.example.com:3128",
          "https://secure-proxy.example.com:443",
          "http://user:pass@proxy.example.com:8080",
        ];

        for (const proxyUrl of proxyUrls) {
          process.env = {
            ...originalEnv,
            ...mockKintoneConfig,
            HTTPS_PROXY: proxyUrl,
          };

          const config = parseKintoneClientConfig();

          expect(config.HTTPS_PROXY).toBe(proxyUrl);
        }
      });
    });

    describe("edge cases", () => {
      it("should accept http URLs", () => {
        process.env = {
          ...originalEnv,
          ...mockKintoneConfig,
          KINTONE_BASE_URL: "http://localhost:8080",
        };

        const config = parseKintoneClientConfig();

        expect(config.KINTONE_BASE_URL).toBe("http://localhost:8080");
      });

      it("should accept very long passwords", () => {
        const longPassword = "a".repeat(1000);
        process.env = {
          ...originalEnv,
          ...mockKintoneConfig,
          KINTONE_PASSWORD: longPassword,
        };

        const config = parseKintoneClientConfig();

        expect(config.KINTONE_PASSWORD).toBe(longPassword);
      });

      it("should handle environment variables with extra properties", () => {
        process.env = {
          ...originalEnv,
          ...mockKintoneConfig,
          OTHER_VAR: "should be ignored",
        };

        const config = parseKintoneClientConfig();

        expect(config).toEqual(mockKintoneConfig);
        expect(config).not.toHaveProperty("OTHER_VAR");
      });
    });
  });
});
