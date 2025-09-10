import { version } from "../version.js";
import { parseKintoneMcpServerConfig } from "./parser.js";
import { PACKAGE_NAME } from "./schema.js";
import type {
  KintoneClientConfig,
  KintoneMcpServerConfig,
} from "./types/config.js";

const config = parseKintoneMcpServerConfig();

export const getMcpServerConfig = (): KintoneMcpServerConfig => {
  return {
    name: PACKAGE_NAME,
    version: version,
  };
};

export const getKintoneClientConfig = (): KintoneClientConfig => {
  return {
    KINTONE_BASE_URL: config.config.KINTONE_BASE_URL,
    KINTONE_USERNAME: config.config.KINTONE_USERNAME,
    KINTONE_PASSWORD: config.config.KINTONE_PASSWORD,
    KINTONE_API_TOKEN: config.config.KINTONE_API_TOKEN,
    KINTONE_BASIC_AUTH_USERNAME: config.config.KINTONE_BASIC_AUTH_USERNAME,
    KINTONE_BASIC_AUTH_PASSWORD: config.config.KINTONE_BASIC_AUTH_PASSWORD,
    HTTPS_PROXY: config.config.HTTPS_PROXY,
    KINTONE_PFX_FILE_PATH: config.config.KINTONE_PFX_FILE_PATH,
    KINTONE_PFX_FILE_PASSWORD: config.config.KINTONE_PFX_FILE_PASSWORD,
    USER_AGENT: config.userAgent,
  };
};

export const getToolConditionConfig = () => {
  return {
    isApiTokenAuth: config.isApiTokenAuth,
  };
};

export const getFileConfig = () => {
  return {
    attachmentsDir: config.config.KINTONE_ATTACHMENTS_DIR,
  };
};
