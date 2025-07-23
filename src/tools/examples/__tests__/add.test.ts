import { describe, it, expect } from 'vitest';
import { add } from '../add.js';
import { z } from 'zod';
import { mockExtra } from '../../../__tests__/utils.js';

describe('add tool', () => {
  describe('tool configuration', () => {
    it('should have correct name', () => {
      expect(add.name).toBe('add_numbers');
    });

    it('should have correct description', () => {
      expect(add.config.description).toBe('Add two numbers together');
    });

    it('should have valid input schema', () => {
      const schema = z.object(add.config.inputSchema!);
      
      // Valid input
      const validInput = { a: 1, b: 2 };
      expect(() => schema.parse(validInput)).not.toThrow();
      
      // Invalid input - missing fields
      expect(() => schema.parse({ a: 1 })).toThrow();
      expect(() => schema.parse({ b: 2 })).toThrow();
      expect(() => schema.parse({})).toThrow();
      
      // Invalid input - wrong types
      expect(() => schema.parse({ a: '1', b: 2 })).toThrow();
      expect(() => schema.parse({ a: 1, b: '2' })).toThrow();
    });

    it('should have valid output schema', () => {
      const schema = z.object(add.config.outputSchema!);
      
      // Valid output
      const validOutput = { result: 3, operation: '1 + 2 = 3' };
      expect(() => schema.parse(validOutput)).not.toThrow();
      
      // Invalid output
      expect(() => schema.parse({ result: '3' })).toThrow();
      expect(() => schema.parse({ operation: '1 + 2 = 3' })).toThrow();
    });
  });

  describe('handler function', () => {
    it('should add two positive numbers correctly', async () => {
      const result = await add.callback({ a: 1, b: 2 }, mockExtra);

      expect(result.structuredContent).toEqual({
        result: 3,
        operation: '1 + 2 = 3'
      });
      
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: JSON.stringify({
          result: 3,
          operation: '1 + 2 = 3'
        }, null, 2)
      });
    });

    it('should add negative numbers correctly', async () => {
      const result = await add.callback({ a: -5, b: -3 }, mockExtra);
      
      expect(result.structuredContent).toEqual({
        result: -8,
        operation: '-5 + -3 = -8'
      });
    });

    it('should add decimal numbers correctly', async () => {
      const result = await add.callback({ a: 1.5, b: 2.7 }, mockExtra);
      
      expect(result.structuredContent).toEqual({
        result: 4.2,
        operation: '1.5 + 2.7 = 4.2'
      });
    });

    it('should handle zero correctly', async () => {
      const result = await add.callback({ a: 0, b: 5 }, mockExtra);
      
      expect(result.structuredContent).toEqual({
        result: 5,
        operation: '0 + 5 = 5'
      });
    });

    it('should handle mixed positive and negative', async () => {
      const result = await add.callback({ a: 10, b: -3 }, mockExtra);
      
      expect(result.structuredContent).toEqual({
        result: 7,
        operation: '10 + -3 = 7'
      });
    });
  });
});