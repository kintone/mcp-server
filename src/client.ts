import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import type { KintoneClientConfig } from "./config.js";

let client: KintoneRestAPIClient | null = null;

export const getKintoneClient = (config: KintoneClientConfig): KintoneRestAPIClient => {
  if (client) {
    return client;
  }

  const { KINTONE_BASE_URL, KINTONE_USERNAME, KINTONE_PASSWORD } = config;

  client = new KintoneRestAPIClient({
    baseUrl: KINTONE_BASE_URL,
    auth: {
      username: KINTONE_USERNAME,
      password: KINTONE_PASSWORD,
    },
  });

  return client;
}

export const resetKintoneClient = (): void => {
  client = null;
}
