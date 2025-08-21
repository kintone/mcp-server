import { parseArgs } from "node:util";
import { z } from "zod";

export const PACKAGE_NAME = "@kintone/mcp-server";

const configSchema = z
  .object({
    KINTONE_BASE_URL: z
      .string()
      .url()
      .describe(
        "The base URL of your kintone environment (e.g., https://example.cybozu.com)",
      ),
    KINTONE_USERNAME: z
      .string()
      .min(1)
      .optional()
      .describe("Username for authentication"),
    KINTONE_PASSWORD: z
      .string()
      .min(1)
      .optional()
      .describe("Password for authentication"),
    KINTONE_API_TOKEN: z
      .string()
      .optional()
      .refine(
        (value) => {
          if (!value) return true;
          const tokens = value.split(",").map((t) => t.trim());
          return (
            tokens.length <= 9 &&
            tokens.every((token) => /^[a-zA-Z0-9]+$/.test(token))
          );
        },
        {
          message:
            "API tokens must be comma-separated alphanumeric strings (max 9 tokens)",
        },
      )
      .describe(
        "API tokens for authentication (comma-separated, max 9 alphanumeric tokens)",
      ),
    KINTONE_BASIC_AUTH_USERNAME: z
      .string()
      .optional()
      .describe("Username for Basic authentication"),
    KINTONE_BASIC_AUTH_PASSWORD: z
      .string()
      .optional()
      .describe("Password for Basic authentication"),
    HTTPS_PROXY: z
      .string()
      .optional()
      .refine(
        (value) =>
          !value || value === "" || z.string().url().safeParse(value).success,
        { message: "Invalid proxy URL format" },
      )
      .describe("HTTPS proxy URL (e.g., http://proxy.example.com:8080)"),
    KINTONE_PFX_FILE_PATH: z
      .string()
      .optional()
      .describe("Path to PFX client certificate file"),
    KINTONE_PFX_FILE_PASSWORD: z
      .string()
      .optional()
      .describe("Password for PFX client certificate file"),
  })
  .refine(
    (data) => {
      // Either username/password or API token must be provided
      const hasUserAuth = data.KINTONE_USERNAME && data.KINTONE_PASSWORD;
      const hasApiToken = data.KINTONE_API_TOKEN;
      return hasUserAuth || hasApiToken;
    },
    {
      message:
        "Either KINTONE_USERNAME/KINTONE_PASSWORD or KINTONE_API_TOKEN must be provided",
      path: [],
    },
  )
  .refine(
    (data) => {
      const hasPath = data.KINTONE_PFX_FILE_PATH;
      const hasPassword = data.KINTONE_PFX_FILE_PASSWORD;
      // Both must be provided together or both must be omitted
      return (hasPath && hasPassword) || (!hasPath && !hasPassword);
    },
    {
      message:
        "Both KINTONE_PFX_FILE_PATH and KINTONE_PFX_FILE_PASSWORD must be provided together",
      path: ["KINTONE_PFX_FILE_PATH"],
    },
  )
  .refine(
    (data) => {
      const hasBasicUsername = data.KINTONE_BASIC_AUTH_USERNAME;
      const hasBasicPassword = data.KINTONE_BASIC_AUTH_PASSWORD;
      // Both must be provided together or both must be omitted
      return (
        (hasBasicUsername && hasBasicPassword) ||
        (!hasBasicUsername && !hasBasicPassword)
      );
    },
    {
      message:
        "Both KINTONE_BASIC_AUTH_USERNAME and KINTONE_BASIC_AUTH_PASSWORD must be provided together",
      path: ["KINTONE_BASIC_AUTH_USERNAME"],
    },
  );

export type KintoneClientConfig = z.infer<typeof configSchema>;

export type KintoneClientConfigParseResult = {
  config: KintoneClientConfig;
  isApiTokenAuth: boolean;
};

/**
 * Common options for all commands
 * Usage: specify to yargs.options()
 * ref. https://cli.kintone.dev/guide/options
 */
export const commonOptions = {
  "base-url": {
    describe: "Kintone Base Url",
    default: process.env.KINTONE_BASE_URL,
    defaultDescription: "KINTONE_BASE_URL",
    type: "string",
    demandOption: true,
    requiresArg: true,
  },
  username: {
    alias: "u",
    describe: "Kintone Username",
    default: process.env.KINTONE_USERNAME,
    defaultDescription: "KINTONE_USERNAME",
    type: "string",
    requiresArg: true,
  },
  password: {
    alias: "p",
    describe: "Kintone Password",
    default: process.env.KINTONE_PASSWORD,
    defaultDescription: "KINTONE_PASSWORD",
    type: "string",
    requiresArg: true,
  },
  "api-token": {
    describe: "App's API token",
    default: process.env.KINTONE_API_TOKEN,
    defaultDescription: "KINTONE_API_TOKEN",
    type: "array",
    string: true,
    requiresArg: true,
  },
  "basic-auth-username": {
    describe: "Kintone Basic Auth Username",
    default: process.env.KINTONE_BASIC_AUTH_USERNAME,
    defaultDescription: "KINTONE_BASIC_AUTH_USERNAME",
    type: "string",
    requiresArg: true,
  },
  "basic-auth-password": {
    describe: "Kintone Basic Auth Password",
    default: process.env.KINTONE_BASIC_AUTH_PASSWORD,
    defaultDescription: "KINTONE_BASIC_AUTH_PASSWORD",
    type: "string",
    requiresArg: true,
  },
  "guest-space-id": {
    describe: "The ID of guest space",
    default: process.env.KINTONE_GUEST_SPACE_ID,
    defaultDescription: "KINTONE_GUEST_SPACE_ID",
    type: "string",
    requiresArg: true,
  },
  "pfx-file-path": {
    describe: "The path to client certificate file",
    type: "string",
    requiresArg: true,
  },
  "pfx-file-password": {
    describe: "The password of client certificate file",
    type: "string",
    requiresArg: true,
  },
  proxy: {
    describe: "The URL of a proxy server",
    default: process.env.HTTPS_PROXY ?? process.env.https_proxy,
    defaultDescription: "HTTPS_PROXY",
    type: "string",
  },
};
// TODO: ↓いい感じにequivalentほしい
// } satisfies Parameters<yargs.Argv["options"]>[0];

const mergeEnvAndCmdArgs = (env: Record<string, string | undefined>) => {
  const { values: cmdArgs } = parseArgs({
    args: process.argv.slice(2), // process.argv[0]はnode、[1]はスクリプトパスなので除外
    allowPositionals: true,
    options: {
      "kintone-base-url": { type: "string" },
      "kintone-username": { type: "string" },
      "kintone-password": { type: "string" },
      "kintone-api-token": { type: "string" },
      "kintone-basic-auth-username": { type: "string" },
      "kintone-basic-auth-password": { type: "string" },
      "kintone-pfx-file-path": { type: "string" },
      "kintone-pfx-file-password": { type: "string" },
      "https-proxy": { type: "string" },
    },
  });

  // 一箇所でまとめて変換
  return {
    KINTONE_BASE_URL: cmdArgs["kintone-base-url"] ?? env.KINTONE_BASE_URL,
    KINTONE_USERNAME: cmdArgs["kintone-username"] ?? env.KINTONE_USERNAME,
    KINTONE_PASSWORD: cmdArgs["kintone-password"] ?? env.KINTONE_PASSWORD,
    KINTONE_API_TOKEN: cmdArgs["kintone-api-token"] ?? env.KINTONE_API_TOKEN,
    KINTONE_BASIC_AUTH_USERNAME:
      cmdArgs["kintone-basic-auth-username"] ?? env.KINTONE_BASIC_AUTH_USERNAME,
    KINTONE_BASIC_AUTH_PASSWORD:
      cmdArgs["kintone-basic-auth-password"] ?? env.KINTONE_BASIC_AUTH_PASSWORD,
    KINTONE_PFX_FILE_PATH:
      cmdArgs["kintone-pfx-file-path"] ?? env.KINTONE_PFX_FILE_PATH,
    KINTONE_PFX_FILE_PASSWORD:
      cmdArgs["kintone-pfx-file-password"] ?? env.KINTONE_PFX_FILE_PASSWORD,
    HTTPS_PROXY: cmdArgs["https-proxy"] ?? env.HTTPS_PROXY ?? env.https_proxy,
  };
};

// TODO: もしかしたら命名変更?
export const parseKintoneClientConfig = (): KintoneClientConfigParseResult => {
  const mergedEnv = mergeEnvAndCmdArgs(process.env);

  const result = configSchema.safeParse(mergedEnv);

  if (result.success) {
    const data = result.data;
    const isApiTokenAuth =
      !(data.KINTONE_USERNAME && data.KINTONE_PASSWORD) &&
      !!data.KINTONE_API_TOKEN;
    return {
      config: data,
      isApiTokenAuth,
    };
  }

  const errors = result.error.format();
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
  // Handle cross-field validation errors
  if (errors._errors?.length) {
    errorMessages.push(...errors._errors);
  }

  throw new Error(
    `Environment variables are missing or invalid:\n${errorMessages.join("\n")}`,
  );
};
