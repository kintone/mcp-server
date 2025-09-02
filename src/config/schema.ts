import { z } from "zod";

export const PACKAGE_NAME = "@kintone/mcp-server";

export const configSchema = z
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
  userAgent: string;
  isApiTokenAuth: boolean;
};
