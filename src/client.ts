import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import {
  PACKAGE_NAME,
  type KintoneClientConfigParseResult,
} from "./config/index.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import { Agent, type AgentOptions } from "https";
import { readFileSync } from "fs";
import { version } from "./version.js";

let instance: { client?: KintoneRestAPIClient; error?: KintoneClientError } = {
  client: undefined,
  error: undefined,
};

export type KintoneClientConfig = {
  KINTONE_BASE_URL?: string;
  KINTONE_USERNAME?: string;
  KINTONE_PASSWORD?: string;
  KINTONE_API_TOKEN?: string;
  KINTONE_BASIC_AUTH_USERNAME?: string;
  KINTONE_BASIC_AUTH_PASSWORD?: string;
  HTTPS_PROXY?: string;
  KINTONE_PFX_FILE_PATH?: string;
  KINTONE_PFX_FILE_PASSWORD?: string;
  isApiTokenAuth?: boolean;
};

export type KintoneClientError = {
  message: string;
};

export const getKintoneClient = (
  config: KintoneClientConfig,
): { client?: KintoneRestAPIClient; error?: KintoneClientError } => {
  if (instance) {
    return instance;
  }

  const authParams = buildAuthParams({
    username: config.KINTONE_USERNAME,
    password: config.KINTONE_PASSWORD,
    apiToken: config.KINTONE_API_TOKEN,
    isApiTokenAuth: config.isApiTokenAuth,
  });

  const client = new KintoneRestAPIClient({
    baseUrl: config.KINTONE_BASE_URL,
    ...authParams,
    ...buildBasicAuthParam({
      basicAuthUsername: config.KINTONE_BASIC_AUTH_USERNAME,
      basicAuthPassword: config.KINTONE_BASIC_AUTH_PASSWORD,
    }),
    userAgent: `${PACKAGE_NAME}@${version}`,
    httpsAgent: buildHttpsAgent({
      proxy: config.HTTPS_PROXY,
      pfxFilePath: config.KINTONE_PFX_FILE_PATH,
      pfxPassword: config.KINTONE_PFX_FILE_PASSWORD,
    }),
  });

  return { client, error: undefined };
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
