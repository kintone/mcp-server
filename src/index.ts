#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { parseKintoneClientConfig } from "./config/index.js";
import { getKintoneClient } from "./client.js";

const main = async () => {
  const transport = new StdioServerTransport();
  console.error("Starting server...");
  const config = parseKintoneClientConfig();
  getKintoneClient(config);
  const server = createServer();
  await server.connect(transport);
};

main().catch(console.error);
