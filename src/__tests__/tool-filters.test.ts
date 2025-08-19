import { describe, expect, it } from "vitest";
import { shouldEnableTool, filterRules } from "../tool-filters.js";
import { mockKintoneConfig } from "./utils.js";

describe("tool-filters", () => {
  describe("shouldEnableTool", () => {
    describe("with API token auth", () => {
      const config = { config: mockKintoneConfig, isApiTokenAuth: true };

      it("should exclude kintone-get-apps", () => {
        expect(shouldEnableTool("kintone-get-apps", config)).toBe(false);
      });

      it("should enable other tools", () => {
        expect(shouldEnableTool("kintone-get-records", config)).toBe(true);
        expect(shouldEnableTool("kintone-add-records", config)).toBe(true);
        expect(shouldEnableTool("unknown-tool", config)).toBe(true);
      });
    });

    describe("without API token auth", () => {
      const config = { config: mockKintoneConfig, isApiTokenAuth: false };

      it("should enable all tools", () => {
        expect(shouldEnableTool("kintone-get-apps", config)).toBe(true);
        expect(shouldEnableTool("kintone-get-records", config)).toBe(true);
        expect(shouldEnableTool("unknown-tool", config)).toBe(true);
      });
    });
  });

  describe("filterRules structure", () => {
    it("should have correct structure", () => {
      expect(Array.isArray(filterRules)).toBe(true);
      expect(filterRules.length).toBeGreaterThan(0);

      filterRules.forEach((rule) => {
        expect(typeof rule.condition).toBe("function");
        expect(Array.isArray(rule.excludeTools)).toBe(true);
      });
    });
  });
});
