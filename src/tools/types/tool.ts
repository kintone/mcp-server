import type { KintoneRestAPIClient } from "@kintone/rest-api-client";
import type {
  CallToolResult,
  ToolAnnotations,
} from "@modelcontextprotocol/sdk/types.js";
import type { ZodObject, ZodRawShape, z } from "zod";

export type ToolCallbackOptions = {
  client: KintoneRestAPIClient;
  attachmentsDir?: string;
};

/**
 * Behavior hints every tool advertises to clients, all set explicitly so
 * that none falls back to the pessimistic default of the MCP specification.
 *
 * - readOnlyHint: true when the tool does not change any data in kintone.
 * - destructiveHint: true when the tool overwrites or deletes existing data;
 *   false when it only adds new data or is read-only.
 * - idempotentHint: true when calling it again with the same arguments has no
 *   additional effect, counting a record or app revision that moves forward
 *   as an effect.
 * - openWorldHint: true when the tool talks to anything other than kintone.
 *
 * @see https://modelcontextprotocol.io/specification/2025-11-25/schema#toolannotations
 */
export type ToolAnnotationHints = Required<
  Pick<
    ToolAnnotations,
    "readOnlyHint" | "destructiveHint" | "idempotentHint" | "openWorldHint"
  >
>;

export type ToolConfig<
  InputArgs extends ZodRawShape,
  OutputArgs extends ZodRawShape,
> = {
  title: string;
  description: string;
  inputSchema: InputArgs;
  outputSchema: OutputArgs;
  annotations: ToolAnnotationHints;
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
  args: z.infer<ZodObject<InputArgs>>,
  extra: ToolCallbackOptions,
) => CallToolResult | Promise<CallToolResult>;
