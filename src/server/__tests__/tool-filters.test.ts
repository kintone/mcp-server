import { describe, expect, it } from "vitest";
import { tools } from "../../tools/index.js";
import { shouldEnableTool } from "../tool-filters.js";

const toolNames = tools.map((tool) => tool.name);

const apiTokenExcludedTools = [
  "kintone-get-apps",
  "kintone-add-app",
  "kintone-add-space-from-template",
  "kintone-search",
  "kintone-update-space",
  "kintone-get-space",
  "kintone-delete-space",
  "kintone-get-customization",
];

describe("shouldEnableTool", () => {
  it.each(toolNames)(
    "should enable %s without API token authentication",
    (toolName) => {
      expect(shouldEnableTool(toolName, { isApiTokenAuth: false })).toBe(true);
    },
  );

  it.each(toolNames)(
    "should enable %s under API token authentication only if it is not excluded",
    (toolName) => {
      expect(shouldEnableTool(toolName, { isApiTokenAuth: true })).toBe(
        !apiTokenExcludedTools.includes(toolName),
      );
    },
  );

  it.each(apiTokenExcludedTools)(
    "should exclude %s, which is a registered tool",
    (toolName) => {
      expect(toolNames).toContain(toolName);
    },
  );
});
