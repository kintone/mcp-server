import { z, type ZodRawShape, type ZodTypeAny } from "zod";
import type { Extra, KintoneToolCallback, Tool, ToolConfig } from "./schema.js";

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
  extra: Extra,
) => {
  return (
    (args: z.objectOutputType<InputArgs, ZodTypeAny>) => callback(args, extra)
  );
};
