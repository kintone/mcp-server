import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { deployApp } from "../deploy-app.js";
import { z } from "zod";
import {
  createMockClient,
  mockKintoneConfig,
} from "../../../../__tests__/utils.js";

// Mock function for deployApp API call
const mockDeployApp = vi.fn();

describe("deploy-app tool", () => {
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
      expect(deployApp.name).toBe("kintone-deploy-app");
    });

    it("should have correct description", () => {
      expect(deployApp.config.description).toBe(
        "Deploy app settings from pre-live to production environment on kintone. " +
          "This is an asynchronous API - use kintone-get-app-deploy-status tool to check deployment progress.",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(deployApp.config.inputSchema!);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputSchema = z.object(deployApp.config.outputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        {
          input: { apps: [{ app: "123" }] },
          description: "single app minimal",
        },
        {
          input: { apps: [{ app: "123", revision: "1" }] },
          description: "single app with revision",
        },
        {
          input: {
            apps: [
              { app: "123", revision: "1" },
              { app: "456", revision: "2" },
            ],
          },
          description: "multiple apps",
        },
        {
          input: {
            apps: [{ app: "123", revision: "1" }],
            revert: true,
          },
          description: "with revert option",
        },
      ])("accepts $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).not.toThrow();
      });
    });

    describe("input schema validation with invalid inputs", () => {
      it.each([
        {
          input: {},
          description: "missing required apps field",
        },
        {
          input: { apps: [] },
          description: "empty apps array",
        },
        {
          input: {
            apps: Array.from({ length: 301 }, (_, i) => ({ app: `${i}` })),
          },
          description: "too many apps (exceeds 300 limit)",
        },
        {
          input: { apps: [{ app: 123 }] },
          description: "app as number",
        },
        {
          input: { apps: [{ app: "123", revision: 1 }] },
          description: "revision as number",
        },
        {
          input: { apps: [{ app: "123" }], revert: "true" },
          description: "revert as string",
        },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    describe("output schema validation with valid outputs", () => {
      it.each([
        {
          output: {
            message:
              "Deployment initiated for 1 app(s). Use kintone-get-app-deploy-status tool to check progress.",
          },
          description: "deployment message",
        },
      ])("accepts $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).not.toThrow();
      });
    });
  });

  describe("callback function", () => {
    it("should call API and return formatted response", async () => {
      const expectedResult = {
        message:
          "Deployment initiated for 1 app(s). Use kintone-get-app-deploy-status tool to check progress.",
      };

      mockDeployApp.mockResolvedValueOnce({});

      const mockClient = createMockClient();
      mockClient.app.deployApp = mockDeployApp;

      const result = await deployApp.callback(
        { apps: [{ app: "123" }] },
        { client: mockClient },
      );

      expect(mockDeployApp).toHaveBeenCalledWith({ apps: [{ app: "123" }] });
      expect(result.structuredContent).toEqual(expectedResult);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(expectedResult, null, 2),
      });
    });

    it("should handle complex parameters", async () => {
      const expectedResult = {
        message:
          "Deployment initiated for 2 app(s). Use kintone-get-app-deploy-status tool to check progress.",
      };

      mockDeployApp.mockResolvedValueOnce({});

      const mockClient = createMockClient();
      mockClient.app.deployApp = mockDeployApp;

      const params = {
        apps: [
          { app: "123", revision: "1" },
          { app: "456", revision: "2" },
        ],
        revert: true,
      };

      const result = await deployApp.callback(params, {
        client: mockClient,
      });

      expect(mockDeployApp).toHaveBeenCalledWith(params);
      expect(result.structuredContent).toEqual(expectedResult);
    });
  });
});
