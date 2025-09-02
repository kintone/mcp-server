import type {  Tool } from "./schema.js";
import { addRecords } from "./kintone/record/add-records.js";
import { deleteRecords } from "./kintone/record/delete-records.js";
import { getRecords } from "./kintone/record/get-records.js";
import { updateRecords } from "./kintone/record/update-records.js";
import { getApp } from "./kintone/app/get-app.js";
import { getApps } from "./kintone/app/get-apps.js";
import { getFormFields } from "./kintone/app/get-form-fields.js";
import { getProcessManagement } from "./kintone/app/get-process-management.js";
import { updateStatuses } from "./kintone/record/update-statuses.js";

export { createToolCallback } from "./factory.js";
const tools: Array<Tool<any, any>> = [
  getApp,
  getApps,
  getFormFields,
  getProcessManagement,
  updateStatuses,
  addRecords,
  deleteRecords,
  getRecords,
  updateRecords,
];

export const getTools = (): Array<Tool<any, any>> => {
  return tools;
}

