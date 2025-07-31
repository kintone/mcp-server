import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { ZodRawShape } from "zod";

// Tool configuration type
type ToolConfig<
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

// Tool type
export type Tool<
  InputArgs extends ZodRawShape = ZodRawShape,
  OutputArgs extends ZodRawShape = ZodRawShape,
> = {
  name: string;
  config: ToolConfig<InputArgs, OutputArgs>;
  callback: ToolCallback<InputArgs>;
};

// Tool creation helper function
export function createTool<
  InputArgs extends ZodRawShape,
  OutputArgs extends ZodRawShape,
>(
  name: string,
  config: ToolConfig<InputArgs, OutputArgs>,
  callback: ToolCallback<InputArgs>,
): Tool<InputArgs, OutputArgs> {
  return {
    name,
    config,
    callback,
  };
}
