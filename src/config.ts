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
    KINTONE_USERNAME: z.string().min(1).describe("Username for authentication"),
    KINTONE_PASSWORD: z.string().min(1).describe("Password for authentication"),
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

export const parseKintoneClientConfig = (): KintoneClientConfig => {
  const result = configSchema.safeParse(process.env);

  if (result.success) {
    return result.data;
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
