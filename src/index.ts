import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { server } from './server.js';

const main = async () => {
  const transport = new StdioServerTransport();
  console.error("Starting server...");
  await server.connect(transport);
};
 
main().catch(console.error);
