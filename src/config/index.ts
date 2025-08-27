import type { KintoneClientConfig } from "../client.js";
import { parseKintoneClientConfig } from "./parser.js";
import type { McpConfig } from "./schema.js";

export {
  PACKAGE_NAME,
  type McpConfigParseResult as KintoneClientConfigParseResult,
  type McpConfig as KintoneClientConfig,
} from "./schema.js";
export { parseCommandLineOptions } from "./command-line.js";

export const getMcpConfig = (): McpConfig => {
  return parseKintoneClientConfig().config;
};

export const isApiTokenAuth = (): boolean => {
  return parseKintoneClientConfig().isApiTokenAuth;
}

export const getKintoneClientConfig = (): KintoneClientConfig => {
  const mcpConfig = getMcpConfig();
  return {
    KINTONE_BASE_URL: mcpConfig.KINTONE_BASE_URL,
    KINTONE_USERNAME: mcpConfig.KINTONE_USERNAME,
    KINTONE_PASSWORD: mcpConfig.KINTONE_PASSWORD,
    KINTONE_BASIC_AUTH_USERNAME: mcpConfig.KINTONE_BASIC_AUTH_USERNAME,
    KINTONE_BASIC_AUTH_PASSWORD: mcpConfig.KINTONE_BASIC_AUTH_PASSWORD,
    HTTPS_PROXY: mcpConfig.HTTPS_PROXY,
    KINTONE_PFX_FILE_PATH: mcpConfig.KINTONE_PFX_FILE_PATH,
    KINTONE_PFX_FILE_PASSWORD: mcpConfig.KINTONE_PFX_FILE_PASSWORD,
    KINTONE_API_TOKEN: mcpConfig.KINTONE_API_TOKEN,
  };
}
