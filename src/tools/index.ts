import { add } from "./examples/add.js";
import { addRecords } from "./kintone/add-records.js";
import { getApp } from "./kintone/get-app.js";
import { getApps } from "./kintone/get-apps.js";
import { getFormFields } from "./kintone/get-form-fields.js";
import { getRecords } from "./kintone/get-records.js";
import type { Tool } from "./types.js";

export const tools: Array<Tool<any, any>> = [
  add,
  addRecords,
  getApp,
  getApps,
  getFormFields,
  getRecords,
];
