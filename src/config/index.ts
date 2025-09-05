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
    ...config.config,
    USER_AGENT: config.userAgent,
  };
};

export const getToolConditionConfig = () => {
  return {
    isApiTokenAuth: config.isApiTokenAuth,
  };
};
