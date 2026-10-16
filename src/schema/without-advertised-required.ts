import type { z } from "zod";

// Some MCP clients never send tools/call when a required array's items declare
// `required`, and keep asking the user for the item keys instead.
// https://github.com/mondaycom/mcp/issues/499
// Tool schemas are advertised with io: "input", which renders the input side of
// the pipe; tools/call is still validated against the original schema.
export const withoutAdvertisedRequired = <T extends z.ZodObject>(schema: T) =>
  schema.partial().pipe(schema);
