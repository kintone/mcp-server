import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { addApp } from "../add-app.js";
import { z } from "zod";
import {
  createMockClient,
  mockKintoneConfig,
} from "../../../../__tests__/utils.js";

// Mock function for addApp API call
const mockAddApp = vi.fn();

describe("add-app tool", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Set up environment variables for testing
    process.env = {
      ...originalEnv,
      ...mockKintoneConfig,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("tool configuration", () => {
    it("should have correct name", () => {
      expect(addApp.name).toBe("kintone-add-app");
    });

    it("should have correct description", () => {
      expect(addApp.config.description).toBe(
        "Create a new app in the pre-live environment on kintone. The pre-live environment is a temporary storage area where app information is saved before deployment. To reflect changes to the production environment, execute the kintone-deploy-app-settings tool after this tool.",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(addApp.config.inputSchema!);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputSchema = z.object(addApp.config.outputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        {
          input: { name: "Test App" },
          description: "minimal required fields",
        },
        {
          input: { name: "Test App", space: 10 },
          description: "with optional space field",
        },
      ])("accepts $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).not.toThrow();
      });
    });

    describe("input schema validation with invalid inputs", () => {
      it.each([
        {
          input: {},
          description: "missing required name field",
        },
        {
          input: { name: "A".repeat(65) },
          description: "name exceeds max length",
        },
        {
          input: { name: 123 },
          description: "name as number",
        },
        {
          input: { name: "Test App", space: "invalid" },
          description: "space as string",
        },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    describe("output schema validation with valid outputs", () => {
      it.each([
        {
          output: { app: "123", revision: "1" },
          description: "app and revision fields",
        },
      ])("accepts $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).not.toThrow();
      });
    });

    describe("output schema validation with invalid outputs", () => {
      it.each([
        {
          output: {},
          description: "missing all required fields",
        },
        {
          output: { app: "123" },
          description: "missing revision field",
        },
        {
          output: { revision: "1" },
          description: "missing app field",
        },
        {
          output: { app: 123, revision: "1" },
          description: "app as number",
        },
        {
          output: { app: "123", revision: 1 },
          description: "revision as number",
        },
      ])("rejects $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).toThrow();
      });
    });
  });

  describe("callback function", () => {
    it("should call API and return formatted response", async () => {
      const mockData = {
        app: "123",
        revision: "1",
      };

      mockAddApp.mockResolvedValueOnce(mockData);

      const mockClient = createMockClient();
      mockClient.app.addApp = mockAddApp;

      const result = await addApp.callback(
        { name: "Test App" },
        { client: mockClient },
      );

      expect(mockAddApp).toHaveBeenCalledWith({ name: "Test App" });
      expect(result.structuredContent).toEqual(mockData);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockData, null, 2),
      });
    });

    it("should handle optional fields", async () => {
      const mockData = {
        app: "123",
        revision: "1",
      };

      mockAddApp.mockResolvedValueOnce(mockData);

      const mockClient = createMockClient();
      mockClient.app.addApp = mockAddApp;

      const params = {
        name: "Test App",
        space: 10,
      };

      const result = await addApp.callback(params, {
        client: mockClient,
      });

      expect(mockAddApp).toHaveBeenCalledWith(params);
      expect(result.structuredContent).toEqual(mockData);
    });
  });
});
