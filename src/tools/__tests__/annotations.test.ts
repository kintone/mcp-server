import { describe, expect, it } from "vitest";
import { tools } from "../index.js";
import type { ToolAnnotationHints } from "../types/tool.js";

const READ: ToolAnnotationHints = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};
const ADD: ToolAnnotationHints = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
};
const ADD_UNIQUE: ToolAnnotationHints = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};
const OVERWRITE: ToolAnnotationHints = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: false,
};
const DELETE: ToolAnnotationHints = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: false,
};

const expectedAnnotations: Record<string, ToolAnnotationHints> = {
  "kintone-get-apps": READ,
  "kintone-get-app": READ,
  "kintone-get-form-fields": READ,
  "kintone-get-form-layout": READ,
  "kintone-get-process-management": READ,
  "kintone-get-app-deploy-status": READ,
  "kintone-get-general-settings": READ,
  "kintone-get-customization": READ,
  "kintone-get-records": READ,
  "kintone-get-record-comments": READ,
  "kintone-get-space": READ,
  "kintone-search": READ,
  "kintone-download-file": READ,
  "kintone-add-app": ADD,
  "kintone-add-form-fields": ADD_UNIQUE,
  "kintone-add-records": ADD,
  "kintone-add-record-comment": ADD,
  "kintone-add-space-from-template": ADD,
  "kintone-update-form-fields": OVERWRITE,
  "kintone-update-form-layout": OVERWRITE,
  "kintone-update-general-settings": OVERWRITE,
  "kintone-update-records": OVERWRITE,
  "kintone-update-statuses": OVERWRITE,
  "kintone-update-space": OVERWRITE,
  "kintone-deploy-app": OVERWRITE,
  "kintone-delete-form-fields": DELETE,
  "kintone-delete-records": DELETE,
  "kintone-delete-space": DELETE,
};

describe("tool annotations", () => {
  it("match the expected hints for every tool", () => {
    expect(
      Object.fromEntries(
        tools.map((tool) => [tool.name, tool.config.annotations]),
      ),
    ).toEqual(expectedAnnotations);
  });
});
