import { describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../index.js";
import { mockKintoneConfig } from "../../__tests__/utils.js";

const JSON_SCHEMA_2020_12 = "https://json-schema.org/draft/2020-12/schema";

const listTools = async () => {
  const server = createServer({
    name: "test-server",
    version: "0.0.0",
    config: {
      clientConfig: mockKintoneConfig,
      fileConfig: {},
      toolConditionConfig: { isApiTokenAuth: false },
    },
  });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([
    client.connect(clientTransport),
    server.connect(serverTransport),
  ]);

  try {
    const { tools } = await client.listTools();
    return tools;
  } finally {
    await client.close();
    await server.close();
  }
};

// Clients following SEP-1613 (Claude Cowork, Claude API, ...) reject tool
// schemas that are not valid JSON Schema 2020-12, and a single invalid tool
// breaks every tool call of the session.
// https://github.com/kintone/mcp-server/issues/544
// https://github.com/kintone/mcp-server/issues/547
describe("tool schemas", () => {
  it("are declared as JSON Schema 2020-12", async () => {
    const tools = await listTools();

    expect(tools.length).toBeGreaterThan(0);
    expect(
      tools.map((tool) => [
        tool.name,
        tool.inputSchema.$schema,
        tool.outputSchema?.$schema,
      ]),
    ).toEqual(
      tools.map((tool) => [
        tool.name,
        JSON_SCHEMA_2020_12,
        JSON_SCHEMA_2020_12,
      ]),
    );
  });

  it("compile as JSON Schema 2020-12", async () => {
    const tools = await listTools();

    const compile = (label: string, schema: unknown) => {
      try {
        new Ajv2020({ strict: false }).compile(schema as object);
        return [];
      } catch (e) {
        return [`${label}: ${(e as Error).message}`];
      }
    };

    expect(
      tools.flatMap((tool) => [
        ...compile(`${tool.name} inputSchema`, tool.inputSchema),
        ...compile(`${tool.name} outputSchema`, tool.outputSchema),
      ]),
    ).toEqual([]);
  });
});
