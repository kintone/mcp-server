import type { KintoneClientConfigParseResult } from "./config/index.js";

export type FilterRule = {
  condition: (config: KintoneClientConfigParseResult) => boolean;
  excludeTools: string[];
};

export const filterRules: FilterRule[] = [
  {
    condition: (config) => config.isApiTokenAuth,
    excludeTools: ["kintone-get-apps"],
  },
];

export function shouldEnableTool(
  toolName: string,
  config: KintoneClientConfigParseResult,
): boolean {
  for (const rule of filterRules) {
    if (rule.condition(config) && rule.excludeTools.includes(toolName)) {
      return false;
    }
  }
  return true;
}
