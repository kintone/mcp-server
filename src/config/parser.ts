import type { ZodError } from "zod/v4";
import { parse } from "./command-line.js";
import { PACKAGE_NAME, configSchema } from "./schema.js";
import { version } from "../version.js";
import type { ParsedConfig, ProvidedConfig } from "./types/config.js";

export const parseKintoneMcpServerConfig = (): ParsedConfig => {
  const cmdArgs = parse(process.argv);
  const mergedConfig = merge(process.env, cmdArgs);

  const result = configSchema.safeParse(mergedConfig);

  if (result.success) {
    const data = result.data;
    const isApiTokenAuth =
      !(data.KINTONE_USERNAME && data.KINTONE_PASSWORD) &&
      !!data.KINTONE_API_TOKEN;
    return {
      config: data,
      userAgent: `${PACKAGE_NAME}@${version}`,
      isApiTokenAuth,
    };
  }

  const errorMessages = createErrorMessage(result.error.format());

  throw new Error(
    `Environment variables are missing or invalid:\n${errorMessages.join("\n")}`,
  );
};

export const merge = (
  env: Record<string, string | undefined>,
  args: Record<string, string | undefined>,
): Partial<ProvidedConfig> => {
  return {
    KINTONE_BASE_URL: args["base-url"] ?? env.KINTONE_BASE_URL,
    KINTONE_USERNAME: args.username ?? env.KINTONE_USERNAME,
    KINTONE_PASSWORD: args.password ?? env.KINTONE_PASSWORD,
    KINTONE_API_TOKEN: args["api-token"] ?? env.KINTONE_API_TOKEN,
    KINTONE_BASIC_AUTH_USERNAME:
      args["basic-auth-username"] ?? env.KINTONE_BASIC_AUTH_USERNAME,
    KINTONE_BASIC_AUTH_PASSWORD:
      args["basic-auth-password"] ?? env.KINTONE_BASIC_AUTH_PASSWORD,
    KINTONE_PFX_FILE_PATH: args["pfx-file-path"] ?? env.KINTONE_PFX_FILE_PATH,
    KINTONE_PFX_FILE_PASSWORD:
      args["pfx-file-password"] ?? env.KINTONE_PFX_FILE_PASSWORD,
    HTTPS_PROXY: args.proxy ?? env.HTTPS_PROXY ?? env.https_proxy,
    KINTONE_ATTACHMENTS_DIR:
      args["attachments-dir"] ?? env.KINTONE_ATTACHMENTS_DIR,
  };
};

const createErrorMessage = (
  errors: ReturnType<ZodError["format"]>,
): string[] => {
  const errorMessages: string[] = [];
  if (errors.KINTONE_BASE_URL?._errors.length) {
    errorMessages.push(
      `KINTONE_BASE_URL: ${errors.KINTONE_BASE_URL._errors.join(", ")}`,
    );
  }
  if (errors.KINTONE_USERNAME?._errors.length) {
    errorMessages.push(
      `KINTONE_USERNAME: ${errors.KINTONE_USERNAME._errors.join(", ")}`,
    );
  }
  if (errors.KINTONE_PASSWORD?._errors.length) {
    errorMessages.push(
      `KINTONE_PASSWORD: ${errors.KINTONE_PASSWORD._errors.join(", ")}`,
    );
  }
  if (errors.KINTONE_API_TOKEN?._errors.length) {
    errorMessages.push(
      `KINTONE_API_TOKEN: ${errors.KINTONE_API_TOKEN._errors.join(", ")}`,
    );
  }
  if (errors.HTTPS_PROXY?._errors.length) {
    errorMessages.push(`HTTPS_PROXY: ${errors.HTTPS_PROXY._errors.join(", ")}`);
  }
  if (errors.KINTONE_PFX_FILE_PATH?._errors.length) {
    errorMessages.push(
      `KINTONE_PFX_FILE_PATH: ${errors.KINTONE_PFX_FILE_PATH._errors.join(", ")}`,
    );
  }
  if (errors.KINTONE_PFX_FILE_PASSWORD?._errors.length) {
    errorMessages.push(
      `KINTONE_PFX_FILE_PASSWORD: ${errors.KINTONE_PFX_FILE_PASSWORD._errors.join(", ")}`,
    );
  }
  if (errors.KINTONE_BASIC_AUTH_USERNAME?._errors.length) {
    errorMessages.push(
      `KINTONE_BASIC_AUTH_USERNAME: ${errors.KINTONE_BASIC_AUTH_USERNAME._errors.join(", ")}`,
    );
  }
  if (errors.KINTONE_BASIC_AUTH_PASSWORD?._errors.length) {
    errorMessages.push(
      `KINTONE_BASIC_AUTH_PASSWORD: ${errors.KINTONE_BASIC_AUTH_PASSWORD._errors.join(", ")}`,
    );
  }
  if (errors.KINTONE_ATTACHMENTS_DIR?._errors.length) {
    errorMessages.push(
      `KINTONE_ATTACHMENTS_DIR: ${errors.KINTONE_ATTACHMENTS_DIR._errors.join(", ")}`,
    );
  }
  // Handle cross-field validation errors
  if (errors._errors?.length) {
    errorMessages.push(...errors._errors.map(String));
  }

  return errorMessages;
};
