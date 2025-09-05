import { describe, it, expect } from "vitest";
import { createTool, createToolCallback } from "../factory.js";
import { z } from "zod";
import { mockToolCallbackOptions } from "../../__tests__/utils.js";

describe("createTool", () => {
  it("should create a tool with correct structure", () => {
    const inputSchema = {
      x: z.number(),
      y: z.string(),
    };

    const outputSchema = {
      result: z.boolean(),
    };

    const handler = async () => {
      return {
        structuredContent: { result: true },
        content: [{ type: "text" as const, text: "test" }],
      };
    };

    const tool = createTool(
      "test_tool",
      {
        title: "Test Tool",
        description: "Test tool",
        inputSchema,
        outputSchema,
      },
      handler,
    );

    expect(tool).toHaveProperty("name");
    expect(tool).toHaveProperty("config");
    expect(tool).toHaveProperty("callback");

    expect(tool.name).toBe("test_tool");
    expect(tool.config.description).toBe("Test tool");
    expect(tool.config.inputSchema).toBe(inputSchema);
    expect(tool.config.outputSchema).toBe(outputSchema);
    expect(typeof tool.callback).toBe("function");
  });

  it("should create a tool without optional fields", () => {
    const handler = async () => {
      return {
        structuredContent: {},
        content: [],
      };
    };

    const tool = createTool(
      "minimal_tool",
      {
        title: "Minimal Tool",
        description: "A tool with minimal config",
        inputSchema: {},
        outputSchema: {},
      },
      handler,
    );

    expect(tool.name).toBe("minimal_tool");
    expect(tool.config).toEqual({
      title: "Minimal Tool",
      description: "A tool with minimal config",
      inputSchema: {},
      outputSchema: {},
    });
    expect(typeof tool.callback).toBe("function");
  });

  it("should preserve handler function behavior", async () => {
    const inputSchema = {
      value: z.number(),
    };

    const handler = async ({ value }: { value: number }) => {
      return {
        structuredContent: { doubled: value * 2 },
        content: [
          { type: "text" as const, text: `${value} * 2 = ${value * 2}` },
        ],
      };
    };

    const tool = createTool(
      "double_tool",
      {
        title: "Double Tool",
        description: "Doubles a number",
        inputSchema,
        outputSchema: { doubled: z.number() },
      },
      handler,
    );

    const result = await tool.callback({ value: 5 }, mockToolCallbackOptions());

    expect(result.structuredContent).toEqual({ doubled: 10 });
    expect(result.content).toEqual([{ type: "text", text: "5 * 2 = 10" }]);
  });
});

describe("createToolCallback", () => {
  it("should wrap callback with options", async () => {
    const callback = async (args: any, options: any) => ({
      content: [
        {
          type: "text" as const,
          text: `Value: ${args.value}, Version: ${options.version}`,
        },
      ],
    });

    const options = mockToolCallbackOptions();
    const wrappedCallback = createToolCallback(callback, options);
    const result = await wrappedCallback({ value: "test" });

    expect(result.content).toEqual([
      { type: "text", text: "Value: test, Version: 1.0.0" },
    ]);
  });
});
