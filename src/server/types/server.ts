import type { KintoneClientConfig } from "../../client/index.js";
import type { Condition as ToolConditionConfig } from "../tool-filters.js";

export type KintoneMcpServerOptions = {
  name: string;
  version: string;
  config: {
    clientConfig: KintoneClientConfig;
    fileConfig: FileConfig;
    toolConditionConfig: ToolConditionConfig;
  };
};

type FileConfig = {
  attachmentsDir?: string;
};
