import { addRecords } from "./kintone/record/add-records.js";
import { deleteRecords } from "./kintone/record/delete-records.js";
import { getRecords } from "./kintone/record/get-records.js";
import { updateRecords } from "./kintone/record/update-records.js";
import { addApp } from "./kintone/app/add-app.js";
import { getApp } from "./kintone/app/get-app.js";
import { getApps } from "./kintone/app/get-apps.js";
import { getFormFields } from "./kintone/app/get-form-fields.js";
import { getAppSettings } from "./kintone/app/get-app-settings.js";
import { updateAppSettings } from "./kintone/app/update-app-settings.js";
import { addFormFields } from "./kintone/app/add-form-fields.js";
import { deleteFormFields } from "./kintone/app/delete-form-fields.js";
import { deployApp } from "./kintone/app/deploy-app.js";
import { getProcessManagement } from "./kintone/app/get-process-management.js";
import { updateStatuses } from "./kintone/record/update-statuses.js";
import type { Tool } from "./utils.js";

export const tools: Array<Tool<any, any>> = [
  addApp,
  getApp,
  getApps,
  getFormFields,
  getAppSettings,
  updateAppSettings,
  addFormFields,
  deleteFormFields,
  deployApp,
  getProcessManagement,
  updateStatuses,
  addRecords,
  deleteRecords,
  getRecords,
  updateRecords,
];
