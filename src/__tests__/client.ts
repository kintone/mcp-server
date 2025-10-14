import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { ProvidedConfig } from "../config/types/config.js";
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
  // 現在の実装では両方とも同じトランスポートを使用
  // 将来的にnpm用の別のトランスポートが追加される可能性を考慮
  switch (runtime) {
    case "docker":
    case "npm":
      return createDockerTransport(config);
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
      "-e",
      "KINTONE_BASE_URL",
      "-e",
      "KINTONE_USERNAME",
      "-e",
      "KINTONE_PASSWORD",
      "kintone-mcp-server:e2e",
    ],
    env: {
      PATH: "/usr/local/bin:/usr/bin:/bin",
      KINTONE_BASE_URL: config.KINTONE_BASE_URL,
      KINTONE_USERNAME: config.KINTONE_USERNAME || "",
      KINTONE_PASSWORD: config.KINTONE_PASSWORD || "",
    },
  });
};
