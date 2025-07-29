import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tools } from "./tools/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, "../package.json"), "utf-8"),
);

const server = new McpServer(
  {
    name: "kintone-mcp-server",
    version: packageJson.version,
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
