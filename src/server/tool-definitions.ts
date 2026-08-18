import { z } from "zod";
import type { Tool as McpTool } from "@modelcontextprotocol/sdk/types.js";
import type { ZodRawShape } from "zod";
import type { Tool } from "../tools/types/tool.js";

// The SDK always emits JSON Schema draft-07 with no way to change the
// dialect, but SEP-1613 clients require 2020-12, so it's built here instead.
// https://github.com/kintone/mcp-server/issues/544
const JSON_SCHEMA_TARGET = "draft-2020-12";

const toJsonSchema = (shape: ZodRawShape, io: "input" | "output") =>
  // Only advertises additionalProperties:false like draft-07 did; registerTool
  // still strips unknown keys via its non-strict schema instead of rejecting.
  z.toJSONSchema(io === "input" ? z.strictObject(shape) : z.object(shape), {
    target: JSON_SCHEMA_TARGET,
    io,
    // "ref" dedupes bare primitives into $defs, leaving some properties as a
    // typeless $ref - clients infer how to parse args from that type.
    reused: "inline",
    // discriminatedUnion/union/nullable() have the same problem via
    // oneOf/anyOf; synthesize a type from the branches, merging into an
    // array (e.g. ["array", "null"]) when they don't all agree.
    override: (ctx) => {
      const schema = ctx.jsonSchema as Record<string, unknown>;
      const branches = (schema.oneOf ?? schema.anyOf) as
        | Array<{ type?: unknown }>
        | undefined;
      if (!branches || "type" in schema) return;

      const types = [...new Set(branches.map((branch) => branch.type))].filter(
        Boolean,
      );
      if (types.length === 1) {
        schema.type = types[0];
      } else if (types.length > 1) {
        schema.type = types;
      }
    },
  }) as McpTool["inputSchema"];

export const buildToolDefinition = (tool: Tool): McpTool => ({
  name: tool.name,
  title: tool.config.title,
  description: tool.config.description,
  inputSchema: toJsonSchema(tool.config.inputSchema, "input"),
  outputSchema: toJsonSchema(tool.config.outputSchema, "output"),
});
