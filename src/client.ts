import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import type { KintoneClientConfig } from "./config.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import { Agent } from "https";

let client: KintoneRestAPIClient | null = null;

export const getKintoneClient = (
  config: KintoneClientConfig,
): KintoneRestAPIClient => {
  if (client) {
    return client;
  }

  const { KINTONE_BASE_URL, KINTONE_USERNAME, KINTONE_PASSWORD, HTTPS_PROXY } =
    config;

  client = new KintoneRestAPIClient({
    baseUrl: KINTONE_BASE_URL,
    auth: {
      username: KINTONE_USERNAME,
      password: KINTONE_PASSWORD,
    },
    httpsAgent: buildHttpsAgent({ proxy: HTTPS_PROXY }),
  });

  return client;
};

export const resetKintoneClient = (): void => {
  client = null;
};

const buildHttpsAgent = (options: { proxy?: string }): Agent => {
  if (!options.proxy) {
    return new Agent();
  }

  try {
    return new HttpsProxyAgent(options.proxy);
  } catch (error) {
    throw new Error(
      `Invalid HTTPS proxy URL: ${options.proxy}. ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
