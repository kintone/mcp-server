import { add } from "./examples/add.js";
import { getApp } from "./get-app.js";
import type { Tool } from "./types.js";

export const tools: Array<Tool<any, any>> = [add, getApp];
