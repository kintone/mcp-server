import type { Tool } from "./types/tool.js";
import { addRecords } from "./kintone/record/add-records.js";
import { deleteRecords } from "./kintone/record/delete-records.js";
import { getRecords } from "./kintone/record/get-records.js";
import { updateRecords } from "./kintone/record/update-records.js";
import { getApp } from "./kintone/app/get-app.js";
import { getApps } from "./kintone/app/get-apps.js";
import { getFormFields } from "./kintone/app/get-form-fields.js";
import { getFormLayout } from "./kintone/app/get-form-layout.js";
import { updateFormFields } from "./kintone/app/update-form-fields.js";
import { updateFormLayout } from "./kintone/app/update-form-layout.js";
import { deleteFormFields } from "./kintone/app/delete-form-fields.js";
import { getProcessManagement } from "./kintone/app/get-process-management.js";
import { getAppDeployStatus } from "./kintone/app/get-app-deploy-status.js";
import { getGeneralSettings } from "./kintone/app/get-general-settings.js";
import { addFormFields } from "./kintone/app/add-form-fields.js";
import { updateStatuses } from "./kintone/record/update-statuses.js";
import { addApp } from "./kintone/app/add-app.js";
import { deployApp } from "./kintone/app/deploy-app.js";
import { updateGeneralSettings } from "./kintone/app/update-general-settings.js";
import { downloadFile } from "./kintone/file/download-file.js";

export { createToolCallback } from "./factory.js";
export const tools: Array<Tool<any, any>> = [
  getApp,
  getApps,
  getFormFields,
  getFormLayout,
  updateFormFields,
  updateFormLayout,
  deleteFormFields,
  getProcessManagement,
  getAppDeployStatus,
  getGeneralSettings,
  addFormFields,
  updateStatuses,
  addRecords,
  deleteRecords,
  getRecords,
  updateRecords,
  addApp,
  deployApp,
  updateGeneralSettings,
  downloadFile,
] as const;
