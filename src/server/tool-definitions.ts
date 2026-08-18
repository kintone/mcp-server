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
    // "ref" extracts every structurally-identical schema into $defs, even
    // bare `z.string()`/`z.boolean()` reused across unrelated fields, which
    // leaves those properties as a bare $ref with no top-level "type" - the
    // same problem the override below works around, but with no branches to
    // synthesize a type from. Inline avoids it at the cost of a larger
    // tools/list (measured: about the same size as the SDK's draft-07 output).
    reused: "inline",
    // z.discriminatedUnion / z.union / .nullable() render as oneOf/anyOf with
    // no top-level "type", which breaks clients that decide how to parse an
    // argument by checking the declared type. Synthesize one from the
    // branches: a shared type across all of them ("object" for a
    // discriminated union, ["array", "null"] for a nullable array), left
    // alone if the branches disagree.
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
