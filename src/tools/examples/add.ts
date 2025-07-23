import { z } from 'zod';
import { createTool } from '../types.js';
import { getConfig } from '../../config.js';

const inputSchema = {
  a: z.number().describe('First number'),
  b: z.number().describe('Second number'),
};

const outputSchema = {
  result: z.number().describe('Sum of the two numbers'),
  operation: z.string().describe('Description of the operation performed'),
};

export const add = createTool(
  'add_numbers',
  {
    description: 'Add two numbers together',
    inputSchema,
    outputSchema,
  },
  async ({ a, b }) => {
    const result = {
      result: a + b,
      operation: `${a} + ${b} = ${a + b}`,
    };

    return {
      structuredContent: result,
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);
