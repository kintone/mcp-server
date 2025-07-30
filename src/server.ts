import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tools } from "./tools/index.js";
import { version } from "./version.js";

const server = new McpServer(
  {
    name: "kintone-mcp-server",
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
