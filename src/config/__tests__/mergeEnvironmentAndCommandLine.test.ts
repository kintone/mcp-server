import { describe, expect, it } from "vitest";
import { mergeEnvironmentAndCommandLine } from "../parser.js";

describe("mergeEnvironmentAndCommandLine", () => {
  it("should use environment variables when no command line arguments are provided", () => {
    const env = {
      KINTONE_BASE_URL: "https://env.example.com",
      KINTONE_USERNAME: "envuser",
      KINTONE_PASSWORD: "envpass",
      KINTONE_API_TOKEN: "envtoken",
      KINTONE_BASIC_AUTH_USERNAME: "envbasicuser",
      KINTONE_BASIC_AUTH_PASSWORD: "envbasicpass",
      HTTPS_PROXY: "http://env-proxy.example.com:8080",
      KINTONE_PFX_FILE_PATH: "/env/path/to/cert.pfx",
      KINTONE_PFX_FILE_PASSWORD: "envpfxpass",
    };

    const cmdArgs = {};

    const result = mergeEnvironmentAndCommandLine(env, cmdArgs);

    expect(result).toEqual({
      KINTONE_BASE_URL: "https://env.example.com",
      KINTONE_USERNAME: "envuser",
      KINTONE_PASSWORD: "envpass",
      KINTONE_API_TOKEN: "envtoken",
      KINTONE_BASIC_AUTH_USERNAME: "envbasicuser",
      KINTONE_BASIC_AUTH_PASSWORD: "envbasicpass",
      HTTPS_PROXY: "http://env-proxy.example.com:8080",
      KINTONE_PFX_FILE_PATH: "/env/path/to/cert.pfx",
      KINTONE_PFX_FILE_PASSWORD: "envpfxpass",
    });
  });

  it("should prioritize command line arguments over environment variables when both are provided", () => {
    const env = {
      KINTONE_BASE_URL: "https://env.example.com",
      KINTONE_USERNAME: "envuser",
      KINTONE_PASSWORD: "envpass",
      KINTONE_API_TOKEN: "envtoken",
      KINTONE_BASIC_AUTH_USERNAME: "envbasicuser",
      KINTONE_BASIC_AUTH_PASSWORD: "envbasicpass",
      HTTPS_PROXY: "http://env-proxy.example.com:8080",
      KINTONE_PFX_FILE_PATH: "/env/path/to/cert.pfx",
      KINTONE_PFX_FILE_PASSWORD: "envpfxpass",
    };

    const cmdArgs = {
      "base-url": "https://cmd.example.com",
      username: "cmduser",
      password: "cmdpass",
      "api-token": "cmdtoken",
      "basic-auth-username": "cmdbasicuser",
      "basic-auth-password": "cmdbasicpass",
      "pfx-file-path": "/cmd/path/to/cert.pfx",
      "pfx-file-password": "cmdpfxpass",
      proxy: "http://cmd-proxy.example.com:8080",
    };

    const result = mergeEnvironmentAndCommandLine(env, cmdArgs);

    expect(result).toEqual({
      KINTONE_BASE_URL: "https://cmd.example.com",
      KINTONE_USERNAME: "cmduser",
      KINTONE_PASSWORD: "cmdpass",
      KINTONE_API_TOKEN: "cmdtoken",
      KINTONE_BASIC_AUTH_USERNAME: "cmdbasicuser",
      KINTONE_BASIC_AUTH_PASSWORD: "cmdbasicpass",
      HTTPS_PROXY: "http://cmd-proxy.example.com:8080",
      KINTONE_PFX_FILE_PATH: "/cmd/path/to/cert.pfx",
      KINTONE_PFX_FILE_PASSWORD: "cmdpfxpass",
    });
  });
});
