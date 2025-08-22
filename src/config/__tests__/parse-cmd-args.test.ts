import { describe, expect, it } from "vitest";
import { parseCommandLineOptions } from "../index.js";

describe("parseCmdArgs", () => {
  it("should parse empty command line arguments", () => {
    const args = ["node", "script.js"];
    const result = parseCommandLineOptions(args);

    expect(result).toEqual({});
  });

  it("should parse all command line arguments", () => {
    const args = [
      "node",
      "script.js",
      "--base-url=https://example.com",
      "--username=testuser",
      "--password=testpass",
      "--api-token=abc123",
      "--basic-auth-username=basicuser",
      "--basic-auth-password=basicpass",
      "--pfx-file-path=/path/to/cert.pfx",
      "--pfx-file-password=pfxpass",
      "--proxy=http://proxy.example.com:8080",
    ];

    const result = parseCommandLineOptions(args);

    expect(result).toEqual({
      "base-url": "https://example.com",
      username: "testuser",
      password: "testpass",
      "api-token": "abc123",
      "basic-auth-username": "basicuser",
      "basic-auth-password": "basicpass",
      "pfx-file-path": "/path/to/cert.pfx",
      "pfx-file-password": "pfxpass",
      proxy: "http://proxy.example.com:8080",
    });
  });
});
