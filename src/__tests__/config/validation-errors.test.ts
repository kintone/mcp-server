import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { parseKintoneClientConfig } from "../../config.js";
import { mockKintoneConfig } from "../utils.js";

describe("config - validation errors", () => {
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
    {
      name: "should throw error when HTTPS_PROXY is invalid URL",
      env: {
        ...mockKintoneConfig,
        HTTPS_PROXY: "not-a-valid-url",
      },
      expectedErrors: [
        "Environment variables are missing or invalid",
        "HTTPS_PROXY: Invalid proxy URL format",
      ],
    },
    {
      name: "should throw error when HTTPS_PROXY has invalid format",
      env: {
        ...mockKintoneConfig,
        HTTPS_PROXY: "://invalid-format",
      },
      expectedErrors: [
        "Environment variables are missing or invalid",
        "HTTPS_PROXY: Invalid proxy URL format",
      ],
    },
    {
      name: "should throw error when only KINTONE_BASIC_AUTH_USERNAME is provided",
      env: {
        ...mockKintoneConfig,
        KINTONE_BASIC_AUTH_USERNAME: "basic-user",
      },
      expectedErrors: [
        "Environment variables are missing or invalid",
        "Both KINTONE_BASIC_AUTH_USERNAME and KINTONE_BASIC_AUTH_PASSWORD must be provided together",
      ],
    },
    {
      name: "should throw error when only KINTONE_BASIC_AUTH_PASSWORD is provided",
      env: {
        ...mockKintoneConfig,
        KINTONE_BASIC_AUTH_PASSWORD: "basic-pass",
      },
      expectedErrors: [
        "Environment variables are missing or invalid",
        "Both KINTONE_BASIC_AUTH_USERNAME and KINTONE_BASIC_AUTH_PASSWORD must be provided together",
      ],
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
