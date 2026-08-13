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

// The same tools registered without the tools/list handler of createServer,
// to diff our tool definitions against the ones the SDK builds by itself.
const listToolsBuiltBySdk = () => {
  const server = new McpServer({ name: "test-server", version: "0.0.0" });
  tools.forEach((tool) =>
    server.registerTool(tool.name, tool.config, () => ({ content: [] })),
  );
  return listToolsOf(server);
};

// Clients following SEP-1613 (Claude Cowork, Claude API, ...) reject tool
// schemas that are not valid JSON Schema 2020-12, and a single invalid tool
// breaks every tool call of the session.
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
