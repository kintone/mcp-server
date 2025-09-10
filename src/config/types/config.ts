import type z from "zod";
import type { configSchema } from "../schema.js";

export type ProvidedConfig = z.infer<typeof configSchema>;

export type ParsedConfig = {
  config: ProvidedConfig;
  userAgent: string;
  isApiTokenAuth: boolean;
};

export type KintoneClientConfig = Omit<
  ProvidedConfig,
  "KINTONE_ATTACHMENTS_DIR"
> & {
  USER_AGENT: string;
};

export type KintoneMcpServerConfig = {
  name: string;
  version: string;
};
