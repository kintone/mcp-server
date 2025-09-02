#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ServerBuilder } from "./server/index.js";
import { getMcpServerConfig, getKintoneClientConfig, getToolConditionCOnfig } from "./config/index.js";

const main = async () => {
  const transport = new StdioServerTransport();
  console.error("Starting server...");

  const mcpServerConfig = getMcpServerConfig();
  const apiClientConfig = getKintoneClientConfig();
  const toolConditionConfig = getToolConditionCOnfig();

  const server = new ServerBuilder()
    .withPackageName(mcpServerConfig.name)
    .withVersion(mcpServerConfig.version)
    .withApiClientConfig(apiClientConfig)
    .withToolConditionConfig(toolConditionConfig)
    .build();

  await server.connect(transport);
};

main().catch(console.error);
