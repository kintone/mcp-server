import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { ProvidedConfig } from "../src/config/types/config.js";
import { Client } from "@modelcontextprotocol/sdk/client";

export const createClient = async (transport: StdioClientTransport) => {
  const client = new Client({
    name: "e2e-client",
    version: "1.0.0",
  });
  await client.connect(transport);
  return client;
};

export type Runtime = "docker" | "npm";

export const createTransport = (
  runtime: Runtime,
  config: ProvidedConfig,
): StdioClientTransport => {
  switch (runtime) {
    case "docker":
      return createDockerTransport(config);
    case "npm":
      return createNpmTransport(config);
    default:
      throw new Error(`Unknown runtime: ${runtime}`);
  }
};

export const createDockerTransport = (config: ProvidedConfig) => {
  return new StdioClientTransport({
    command: "docker",
    args: [
      "run",
      "-i",
      "--rm",
      // -eフラグを展開
      // e.g. "-e", "KINTONE_BASE_URL", "-e", "KINTONE_API_TOKEN", ...
      ...Object.keys(config).flatMap((key) => ["-e", key]),
      "kintone-mcp-server:e2e",
    ],
    env: {
      PATH: "/usr/local/bin:/usr/bin:/bin",
      ...config,
    },
  });
};

const ENV_TO_CLI_ARG = {
  KINTONE_BASE_URL: "--base-url",
  KINTONE_USERNAME: "--username",
  KINTONE_PASSWORD: "--password",
  KINTONE_API_TOKEN: "--api-token",
  KINTONE_BASIC_AUTH_USERNAME: "--basic-auth-username",
  KINTONE_BASIC_AUTH_PASSWORD: "--basic-auth-password",
  HTTPS_PROXY: "--proxy",
  KINTONE_PFX_FILE_PATH: "--pfx-file-path",
  KINTONE_PFX_FILE_PASSWORD: "--pfx-file-password",
  KINTONE_ATTACHMENTS_DIR: "--attachments-dir",
} as const;

const isEnvKey = (key: string): key is keyof typeof ENV_TO_CLI_ARG =>
  key in ENV_TO_CLI_ARG;

export const createNpmTransport = (config: ProvidedConfig) => {
  const args: string[] = ["kintone-mcp-server"];

  for (const [envKey, value] of Object.entries(config)) {
    if (value !== undefined && isEnvKey(envKey)) {
      args.push(ENV_TO_CLI_ARG[envKey], value);
    }
  }

  return new StdioClientTransport({
    command: "npx",
    args,
  });
};
