import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { tools } from './tools/index.js';

const server = new McpServer(
  {
    name: 'calculator-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

tools.forEach(tool => {
  server.registerTool(tool.name, tool.config, tool.callback);
});

export { server };
