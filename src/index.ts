#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "./server.js";
import { parseKintoneClientConfig } from "./config.js";

const main = async () => {
  const transport = new StdioServerTransport();
  console.error("Starting server...");
  parseKintoneClientConfig();
  await server.connect(transport);
};

main().catch(console.error);
