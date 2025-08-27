type Condition = {
  isApiTokenAuth: boolean;
};
type FilterRule = {
  condition: (condition: Condition) => boolean;
  excludeTools: string[];
};

const filterRules: FilterRule[] = [
  {
    condition: (condition) => condition.isApiTokenAuth,
    excludeTools: ["kintone-get-apps"],
  },
];

export function shouldEnableTool(
  toolName: string,
  condition: Condition,
): boolean {
  for (const rule of filterRules) {
    if (rule.condition(condition) && rule.excludeTools.includes(toolName)) {
      return false;
    }
  }
  return true;
}
