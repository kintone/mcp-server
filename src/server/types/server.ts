import type { KintoneClientConfig } from "../../client/index.js";
import type { Condition as ToolConditionConfig } from "../tool-filters.js";
export type KintoneMcpServerOptions = {
  name: string;
  version: string;
  config: {
    clientConfig: KintoneClientConfig;
    toolConditionConfig: ToolConditionConfig;
  };
};
