import { describe, it, expect } from 'vitest';
import { createTool } from '../types.js';
import { z } from 'zod';
import { mockExtra } from '../../__tests__/utils.js';

describe('createTool', () => {
  it('should create a tool with correct structure', () => {
    const inputSchema = {
      x: z.number(),
      y: z.string(),
    };
    
    const outputSchema = {
      result: z.boolean(),
    };
    
    const handler = async ({ x, y }: { x: number; y: string }) => {
      return {
        structuredContent: { result: true },
        content: [{ type: 'text' as const, text: 'test' }],
      };
    };
    
    const tool = createTool(
      'test_tool',
      {
        description: 'Test tool',
        inputSchema,
        outputSchema,
      },
      handler
    );
    
    expect(tool).toHaveProperty('name');
    expect(tool).toHaveProperty('config');
    expect(tool).toHaveProperty('callback');
    
    expect(tool.name).toBe('test_tool');
    expect(tool.config.description).toBe('Test tool');
    expect(tool.config.inputSchema).toBe(inputSchema);
    expect(tool.config.outputSchema).toBe(outputSchema);
    expect(typeof tool.callback).toBe('function');
  });

  it('should create a tool without optional fields', () => {
    const handler = async () => {
      return {
        structuredContent: {},
        content: [],
      };
    };
    
    const tool = createTool(
      'minimal_tool',
      {},
      handler
    );
    
    expect(tool.name).toBe('minimal_tool');
    expect(tool.config).toEqual({});
    expect(typeof tool.callback).toBe('function');
  });

  it('should preserve handler function behavior', async () => {
    const inputSchema = {
      value: z.number(),
    };
    
    const handler = async ({ value }: { value: number }) => {
      return {
        structuredContent: { doubled: value * 2 },
        content: [{ type: 'text' as const, text: `${value} * 2 = ${value * 2}` }],
      };
    };
    
    const tool = createTool(
      'double_tool',
      { inputSchema },
      handler
    );
    
    const result = await tool.callback({ value: 5 }, mockExtra);
    
    expect(result.structuredContent).toEqual({ doubled: 10 });
    expect(result.content).toEqual([{ type: 'text', text: '5 * 2 = 10' }]);
  });
});