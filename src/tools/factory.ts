import type { z, ZodObject, ZodRawShape } from "zod";
import type {
  ToolConfig,
  KintoneToolCallback,
  Tool,
  ToolCallbackOptions,
} from "./types/tool.js";

export const createTool = <
  InputArgs extends ZodRawShape,
  OutputArgs extends ZodRawShape,
>(
  name: string,
  config: ToolConfig<InputArgs, OutputArgs>,
  callback: KintoneToolCallback<InputArgs>,
): Tool<InputArgs, OutputArgs> => {
  return {
    name,
    config,
    callback,
  };
};

export const createToolCallback = <InputArgs extends ZodRawShape>(
  callback: KintoneToolCallback<InputArgs>,
  options: ToolCallbackOptions,
) => {
  return (args: z.infer<ZodObject<InputArgs>>) => callback(args, options);
};
