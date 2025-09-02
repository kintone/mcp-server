import { describe, it, expect } from "vitest";
import { createTool } from "../schema.js";
import { z } from "zod";
import { mockExtra } from "../../__tests__/utils.js";

describe("createTool", () => {
  it("should create a tool with correct structure", () => {
    const inputSchema = {
      x: z.number(),
      y: z.string(),
    };

    const callback = async () => ({
      content: [
        {
          type: "text" as const,
          text: "Test result",
        },
      ],
    });

    const tool = createTool(
      "test-tool",
      {
        description: "A test tool",
        inputSchema,
      },
      callback,
    );

    expect(tool).toMatchObject({
      name: "test-tool",
      config: {
        description: "A test tool",
        inputSchema,
      },
      callback,
    });
  });

  it("should work with tool callback", async () => {
    const callback = async () => ({
      content: [
        {
          type: "text" as const,
          text: "Test result",
        },
      ],
    });

    const tool = createTool(
      "test-tool",
      {
        description: "A test tool",
      },
      callback,
    );

    const result = await tool.callback({}, mockExtra());
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Test result",
        },
      ],
    });
  });
});
