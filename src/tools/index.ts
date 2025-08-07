import { add } from "./examples/add.js";
import { addRecords } from "./kintone/add-records.js";
import { getApp } from "./kintone/get-app.js";
import { getApps } from "./kintone/get-apps.js";
import { getFormFields } from "./kintone/get-form-fields.js";
import { getRecords } from "./kintone/get-records.js";
import { getProcessManagement } from "./kintone/get-process-management.js";
import { deleteRecords } from "./kintone/delete-records.js";
import type { Tool } from "./types.js";
import { updateRecords } from "./kintone/update-records.js";

export const tools: Array<Tool<any, any>> = [
  add,
  addRecords,
  getApp,
  getApps,
  getFormFields,
  getRecords,
  getProcessManagement,
  updateRecords,
  deleteRecords,
];
