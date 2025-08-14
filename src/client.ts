import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import type { KintoneClientConfig } from "./config.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import { Agent, type AgentOptions } from "https";
import { readFileSync } from "fs";

let client: KintoneRestAPIClient | null = null;

export const getKintoneClient = (
  config: KintoneClientConfig,
): KintoneRestAPIClient => {
  if (client) {
    return client;
  }

  const {
    KINTONE_BASE_URL,
    KINTONE_USERNAME,
    KINTONE_PASSWORD,
    KINTONE_BASIC_AUTH_USERNAME,
    KINTONE_BASIC_AUTH_PASSWORD,
    HTTPS_PROXY,
    KINTONE_PFX_FILE_PATH,
    KINTONE_PFX_FILE_PASSWORD,
  } = config;

  client = new KintoneRestAPIClient({
    baseUrl: KINTONE_BASE_URL,
    auth: {
      username: KINTONE_USERNAME,
      password: KINTONE_PASSWORD,
    },
    ...buildBasicAuthParam({
      basicAuthUsername: KINTONE_BASIC_AUTH_USERNAME,
      basicAuthPassword: KINTONE_BASIC_AUTH_PASSWORD,
    }),
    httpsAgent: buildHttpsAgent({
      proxy: HTTPS_PROXY,
      pfxFilePath: KINTONE_PFX_FILE_PATH,
      pfxPassword: KINTONE_PFX_FILE_PASSWORD,
    }),
  });

  return client;
};

export const resetKintoneClient = (): void => {
  client = null;
};

const buildBasicAuthParam = (options: {
  basicAuthUsername?: string;
  basicAuthPassword?: string;
}) => {
  return options.basicAuthUsername && options.basicAuthPassword
    ? {
        basicAuth: {
          username: options.basicAuthUsername,
          password: options.basicAuthPassword,
        },
      }
    : {};
};

const buildHttpsAgent = (options: {
  proxy?: string;
  pfxFilePath?: string;
  pfxPassword?: string;
}): Agent => {
  const agentOptions: AgentOptions = {};

  // Add PFX certificate if provided
  if (options.pfxFilePath && options.pfxPassword) {
    try {
      agentOptions.pfx = readFileSync(options.pfxFilePath);
      agentOptions.passphrase = options.pfxPassword;
    } catch (error) {
      throw new Error(
        `Failed to read PFX file: ${options.pfxFilePath}. ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Use proxy if provided
  if (options.proxy) {
    try {
      return new HttpsProxyAgent(options.proxy, agentOptions);
    } catch (error) {
      throw new Error(
        `Invalid HTTPS proxy URL: ${options.proxy}. ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return new Agent(agentOptions);
};
