import { addRecords } from "./kintone/record/add-records.js";
import { deleteRecords } from "./kintone/record/delete-records.js";
import { getRecords } from "./kintone/record/get-records.js";
import { updateRecords } from "./kintone/record/update-records.js";
import { createGetAppTool } from "./kintone/app/get-app.js";
import { getApps } from "./kintone/app/get-apps.js";
import { getFormFields } from "./kintone/app/get-form-fields.js";
import { getProcessManagement } from "./kintone/app/get-process-management.js";
import { updateStatuses } from "./kintone/record/update-statuses.js";
import { getKintoneClient } from "../client.js";
import { getKintoneClientConfig } from "../config/index.js";
import type { Tool } from "./utils.js";

const client = getKintoneClient(getKintoneClientConfig());

export const tools: Array<Tool<any, any>> = [
  createGetAppTool(client),
  getApps,
  getFormFields,
  getProcessManagement,
  updateStatuses,
  addRecords,
  deleteRecords,
  getRecords,
  updateRecords,
];
