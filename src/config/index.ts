import { version } from "../version.js";
import { parseKintoneClientConfig } from "./parser.js";
import { PACKAGE_NAME } from "./schema.js";

const config = parseKintoneClientConfig();

export const getMcpServerConfig = () => {
  return {
    name: PACKAGE_NAME,
    version: version,
    };
}

export const getKintoneClientConfig = () => {
  return {
    ...config.config,
    userAgent: config.userAgent,
  };
}

export const getToolConditionCOnfig = () => {
  return {
    isApiTokenAuth: config.isApiTokenAuth,
  };
};
