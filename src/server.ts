import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tools } from "./tools/index.js";
import { version } from "./version.js";
import { PACKAGE_NAME } from "./config.js";

const server = new McpServer(
  {
    name: PACKAGE_NAME,
    version,
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

tools.forEach((tool) => {
  server.registerTool(tool.name, tool.config, tool.callback);
});

export { server };
