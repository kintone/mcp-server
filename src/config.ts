import { z } from "zod";

const configSchema = z.object({
  KINTONE_BASE_URL: z
    .string()
    .url()
    .describe(
      "The base URL of your kintone environment (e.g., https://example.cybozu.com)",
    ),
  KINTONE_USERNAME: z.string().min(1).describe("Username for authentication"),
  KINTONE_PASSWORD: z.string().min(1).describe("Password for authentication"),
  HTTPS_PROXY: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value || value === "" || z.string().url().safeParse(value).success,
      { message: "Invalid proxy URL format" },
    )
    .describe("HTTPS proxy URL (e.g., http://proxy.example.com:8080)"),
});

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

  throw new Error(
    `Environment variables are missing or invalid:\n${errorMessages.join("\n")}`,
  );
};
