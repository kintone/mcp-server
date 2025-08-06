import { add } from "./examples/add.js";
import { getApp } from "./kintone/get-app.js";
import { getApps } from "./kintone/get-apps.js";
import { getFormFields } from "./kintone/get-form-fields.js";
import { getRecords } from "./kintone/get-records.js";
import { getProcessManagement } from "./kintone/get-process-management.js";
import type { Tool } from "./types.js";

export const tools: Array<Tool<any, any>> = [
  add,
  getApp,
  getApps,
  getFormFields,
  getRecords,
  getProcessManagement,
];
