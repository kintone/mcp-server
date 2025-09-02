import type { KintoneRestAPIClient } from "@kintone/rest-api-client";
import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolAnnotations, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ZodRawShape, ZodTypeAny } from "zod";
import { z } from "zod";

export type Extra = {
  client: KintoneRestAPIClient;
};

export type ToolConfig<
  InputArgs extends ZodRawShape,
  OutputArgs extends ZodRawShape,
> = {
  title?: string;
  description?: string;
  inputSchema?: InputArgs;
  outputSchema?: OutputArgs;
  annotations?: ToolAnnotations;
  callback?: ToolCallback<InputArgs>;
  enabled?: boolean;
};

export type Tool<
  InputArgs extends ZodRawShape = ZodRawShape,
  OutputArgs extends ZodRawShape = ZodRawShape,
> = {
  name: string;
  config: ToolConfig<InputArgs, OutputArgs>;
  callback: KintoneToolCallback<InputArgs>;
};

export type KintoneToolCallback<InputArgs extends ZodRawShape> = (
  args: z.objectOutputType<InputArgs, ZodTypeAny>,
  extra: Extra,
) => CallToolResult | Promise<CallToolResult>;

