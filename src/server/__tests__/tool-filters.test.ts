import { describe, expect, it } from "vitest";
import { shouldEnableTool } from "../tool-filters.js";

describe("shouldEnableTool", () => {
  describe("kintone-get-customization", () => {
    it("should be disabled under API token authentication", () => {
      expect(
        shouldEnableTool("kintone-get-customization", { isApiTokenAuth: true }),
      ).toBe(false);
    });

    it("should be enabled without API token authentication", () => {
      expect(
        shouldEnableTool("kintone-get-customization", {
          isApiTokenAuth: false,
        }),
      ).toBe(true);
    });
  });

  it("should keep tools that are not excluded enabled under API token authentication", () => {
    expect(
      shouldEnableTool("kintone-get-general-settings", {
        isApiTokenAuth: true,
      }),
    ).toBe(true);
  });
});
