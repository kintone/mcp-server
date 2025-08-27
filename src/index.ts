#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { setupServer } from "./server.js";

const main = async () => {
  console.error("Starting server...");
  await setupServer().connect(new StdioServerTransport());
};

main().catch(console.error);
