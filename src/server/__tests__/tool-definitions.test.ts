import { describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createServer } from "../index.js";
import { tools } from "../../tools/index.js";
import { mockKintoneConfig } from "../../__tests__/utils.js";
import type { McpServer as McpServerType } from "@modelcontextprotocol/sdk/server/mcp.js";

const JSON_SCHEMA_2020_12 = "https://json-schema.org/draft/2020-12/schema";

const listToolsOf = async (server: McpServerType) => {
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([
    client.connect(clientTransport),
    server.connect(serverTransport),
  ]);

  try {
    return (await client.listTools()).tools;
  } finally {
    await client.close();
    await server.close();
  }
};

const listTools = () =>
  listToolsOf(
    createServer({
      name: "test-server",
      version: "0.0.0",
      config: {
        clientConfig: mockKintoneConfig,
        fileConfig: {},
        toolConditionConfig: { isApiTokenAuth: false },
      },
    }),
  );

const listToolsBuiltBySdk = () => {
  const server = new McpServer({ name: "test-server", version: "0.0.0" });
  tools.forEach((tool) =>
    server.registerTool(tool.name, tool.config, () => ({ content: [] })),
  );
  return listToolsOf(server);
};

// SEP-1613 clients (Claude Cowork, Claude API) reject tools whose schema
// isn't 2020-12, and one invalid tool breaks every call in the session.
// https://github.com/kintone/mcp-server/issues/544
// https://github.com/kintone/mcp-server/issues/547
describe("tool schemas", () => {
  it("are declared as JSON Schema 2020-12", async () => {
    const advertised = await listTools();

    expect(advertised.length).toBeGreaterThan(0);
    expect(
      advertised.map((tool) => [
        tool.name,
        tool.inputSchema.$schema,
        tool.outputSchema?.$schema,
      ]),
    ).toEqual(
      advertised.map((tool) => [
        tool.name,
        JSON_SCHEMA_2020_12,
        JSON_SCHEMA_2020_12,
      ]),
    );
  });

  it("reject extra properties", async () => {
    const advertised = await listTools();

    // The input schemas say so because they are built from strict objects; the
    // output ones because Zod adds it for "io: output" on its own.
    expect(
      advertised.map((tool) => [
        tool.name,
        tool.inputSchema.additionalProperties,
        tool.outputSchema?.additionalProperties,
      ]),
    ).toEqual(advertised.map((tool) => [tool.name, false, false]));
  });

  it("keep every tool property the SDK advertises", async () => {
    const [ours, bySdk] = await Promise.all([
      listTools(),
      listToolsBuiltBySdk(),
    ]);

    // "execution" is dropped on purpose: an absent one means the same as the
    // "taskSupport: forbidden" the SDK fills in for tools without task support.
    const withoutSchemas = (tool: Record<string, unknown>) => {
      const { inputSchema, outputSchema, execution, ...rest } = tool;
      return rest;
    };

    expect(ours.map(withoutSchemas)).toEqual(bySdk.map(withoutSchemas));
  });

  it("keep advertising minItems for the search query", async () => {
    const advertised = await listTools();

    const search = advertised.find((tool) => tool.name === "kintone-search");
    expect(search?.inputSchema.properties?.query.minItems).toBe(1);
  });

  it("declare a type for every top-level input property", async () => {
    // A property built only from oneOf/anyOf has no top-level "type", which
    // breaks clients that decide how to parse an argument from it.
    const advertised = await listTools();

    expect(
      advertised.flatMap((tool) => {
        const properties = tool.inputSchema.properties ?? {};
        return Object.entries(properties)
          .filter(([, propertySchema]) => !("type" in propertySchema))
          .map(([name]) => `${tool.name}: ${name}`);
      }),
    ).toEqual([]);
  });

  // Some MCP clients cannot build the arguments for an array that is required
  // at the top level when its "items" schema declares "required" of its own:
  // they never send tools/call and keep asking the user for the item keys. The
  // affected tools leave those item fields optional and check them in the
  // callback instead (src/tools/validation.ts).
  // https://github.com/mondaycom/mcp/issues/499
  //
  // Only the "items" schema itself is checked. "required" further down (inside
  // properties, anyOf or additionalProperties) is left alone, because
  // kintone-add-records advertises it and is not affected.
  it("never declare required directly on the items of a required array", async () => {
    const advertised = await listTools();

    // "kintone-search: query" is a tuple with a rest element, so it also
    // advertises prefixItems. Whether the same clients stumble on that shape
    // has not been confirmed, so it is left alone rather than reshaped blind.
    const known = ["kintone-search: query"];

    expect(
      advertised.flatMap((tool) => {
        const required: string[] = tool.inputSchema.required ?? [];
        return Object.entries(tool.inputSchema.properties ?? {})
          .filter(
            ([name, property]) =>
              required.includes(name) &&
              (property as { items?: { required?: unknown } }).items
                ?.required !== undefined,
          )
          .map(([name]) => `${tool.name}: ${name}`);
      }),
    ).toEqual(known);
  });

  // Dropping the item-level "required" must not be done by dropping the array
  // itself from "required", which would let a client omit the argument.
  it("keep arrays whose items the callback validates required", async () => {
    const advertised = await listTools();

    const arrays = [
      ["kintone-update-records", "records"],
      ["kintone-update-statuses", "records"],
      ["kintone-deploy-app", "apps"],
      ["kintone-add-space-from-template", "members"],
    ];

    expect(
      arrays.map(([toolName, property]) => {
        const tool = advertised.find(
          (candidate) => candidate.name === toolName,
        );
        return [
          toolName,
          tool?.inputSchema.required?.includes(property),
          (tool?.inputSchema.properties?.[property] as { type?: string })?.type,
        ];
      }),
    ).toEqual(arrays.map(([toolName]) => [toolName, true, "array"]));
  });

  it("compile as JSON Schema 2020-12", async () => {
    const advertised = await listTools();

    const compile = (label: string, schema: unknown) => {
      try {
        new Ajv2020({ strict: false }).compile(schema as object);
        return [];
      } catch (e) {
        return [`${label}: ${(e as Error).message}`];
      }
    };

    expect(
      advertised.flatMap((tool) => [
        ...compile(`${tool.name} inputSchema`, tool.inputSchema),
        ...compile(`${tool.name} outputSchema`, tool.outputSchema),
      ]),
    ).toEqual([]);
  });
});
