import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import { PACKAGE_NAME, type KintoneClientConfigParseResult } from "./config.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import { Agent, type AgentOptions } from "https";
import { readFileSync } from "fs";
import { version } from "./version.js";

let client: KintoneRestAPIClient | null = null;

export const getKintoneClient = (
  config: KintoneClientConfigParseResult,
): KintoneRestAPIClient => {
  if (client) {
    return client;
  }

  const {
    kintoneBaseUrl,
    kintoneUsername,
    kintonePassword,
    kintoneApiToken,
    kintoneBasicAuthUsername,
    kintoneBasicAuthPassword,
    httpsProxy,
    kintonePfxFilePath,
    kintonePfxFilePassword,
  } = config.config;

  const authParams = buildAuthParams({
    username: kintoneUsername,
    password: kintonePassword,
    apiToken: kintoneApiToken,
    isApiTokenAuth: config.isApiTokenAuth,
  });

  client = new KintoneRestAPIClient({
    baseUrl: kintoneBaseUrl,
    ...authParams,
    ...buildBasicAuthParam({
      basicAuthUsername: kintoneBasicAuthUsername,
      basicAuthPassword: kintoneBasicAuthPassword,
    }),
    userAgent: `${PACKAGE_NAME}@${version}`,
    httpsAgent: buildHttpsAgent({
      proxy: httpsProxy,
      pfxFilePath: kintonePfxFilePath,
      pfxPassword: kintonePfxFilePassword,
    }),
  });

  return client;
};

export const resetKintoneClient = (): void => {
  client = null;
};

const buildAuthParams = (option: {
  username?: string;
  password?: string;
  apiToken?: string;
  isApiTokenAuth?: boolean;
}) => {
  return option.isApiTokenAuth
    ? { auth: { apiToken: option.apiToken } }
    : { auth: { username: option.username, password: option.password } };
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
