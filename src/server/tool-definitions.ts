import { z } from "zod";
import type { Tool as McpTool } from "@modelcontextprotocol/sdk/types.js";
import type { ZodRawShape } from "zod";
import type { Tool } from "../tools/types/tool.js";

// MCP SDK converts Zod schemas with JSON Schema draft-07 and exposes no option
// to change the dialect, while MCP clients following SEP-1613 accept JSON
// Schema 2020-12 only. Build the tool definitions ourselves so that tools/list
// advertises 2020-12 schemas.
// https://github.com/kintone/mcp-server/issues/544
const JSON_SCHEMA_TARGET = "draft-2020-12";

const toJsonSchema = (shape: ZodRawShape, io: "input" | "output") =>
  // Zod emits "additionalProperties": false for strict objects only, so build
  // the input schema from a strict object to keep advertising "no extra
  // parameters" as the previous draft-07 output did. Tool arguments are still
  // parsed with the non-strict schemas registered by registerTool, so unknown
  // keys keep being stripped instead of rejected.
  z.toJSONSchema(io === "input" ? z.strictObject(shape) : z.object(shape), {
    target: JSON_SCHEMA_TARGET,
    io,
    // Extract schemas that appear more than once into $defs, as the previous
    // draft-07 output did. Inlining them grows tools/list by about 23%.
    reused: "ref",
  }) as McpTool["inputSchema"];

export const buildToolDefinition = (tool: Tool): McpTool => ({
  name: tool.name,
  title: tool.config.title,
  description: tool.config.description,
  inputSchema: toJsonSchema(tool.config.inputSchema, "input"),
  outputSchema: toJsonSchema(tool.config.outputSchema, "output"),
});
