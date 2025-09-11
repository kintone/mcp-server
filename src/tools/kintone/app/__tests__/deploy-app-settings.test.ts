import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { deployAppSettings } from "../deploy-app-settings.js";
import { z } from "zod";
import { createMockClient } from "../../../../__tests__/utils.js";

const mockDeployApp = vi.fn();

describe("deploy-app-settings tool", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      KINTONE_BASE_URL: "https://example.cybozu.com",
      KINTONE_USERNAME: "testuser",
      KINTONE_PASSWORD: "testpass",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("tool configuration", () => {
    it("should have correct name", () => {
      expect(deployAppSettings.name).toBe("kintone-deploy-app-settings");
    });

    it("should have correct description", () => {
      expect(deployAppSettings.config.description).toBe(
        "Deploy app settings from development to production environment on kintone",
      );
    });

    it("should have valid input schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(deployAppSettings.config.inputSchema!);

      const validInput = {
        apps: [{ app: "123" }],
      };
      expect(() => schema.parse(validInput)).not.toThrow();

      const validInputWithRevision = {
        apps: [{ app: "123", revision: "1" }],
        revert: false,
      };
      expect(() => schema.parse(validInputWithRevision)).not.toThrow();

      expect(() => schema.parse({})).toThrow();

      const tooManyApps = Array.from({ length: 301 }, (_, i) => ({
        app: `${i}`,
      }));
      expect(() =>
        schema.parse({
          apps: tooManyApps,
        }),
      ).toThrow();
    });

    it("should have valid output schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(deployAppSettings.config.outputSchema!);

      const validOutput = {
        success: true,
      };
      expect(() => schema.parse(validOutput)).not.toThrow();

      expect(() => schema.parse({})).toThrow();
    });
  });

  describe("callback function", () => {
    it("should deploy app settings successfully", async () => {
      mockDeployApp.mockResolvedValueOnce(undefined);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(deployAppSettings.config.inputSchema!);
      const params = schema.parse({
        apps: [{ app: "123" }],
      });

      const mockClient = createMockClient();
      mockClient.app.deployApp = mockDeployApp;

      const result = await deployAppSettings.callback(params, {
        client: mockClient,
      });

      expect(mockDeployApp).toHaveBeenCalledWith({ apps: [{ app: "123" }] });
      expect(result.structuredContent).toEqual({ success: true });
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify({ success: true }, null, 2),
      });
    });

    it("should deploy with revert option", async () => {
      mockDeployApp.mockResolvedValueOnce(undefined);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(deployAppSettings.config.inputSchema!);
      const params = schema.parse({
        apps: [{ app: "123", revision: "1" }],
        revert: true,
      });

      const mockClient = createMockClient();
      mockClient.app.deployApp = mockDeployApp;

      const result = await deployAppSettings.callback(params, {
        client: mockClient,
      });

      expect(mockDeployApp).toHaveBeenCalledWith({
        apps: [{ app: "123", revision: "1" }],
        revert: true,
      });
      expect(result.structuredContent).toEqual({ success: true });
    });

    it("should deploy multiple apps", async () => {
      mockDeployApp.mockResolvedValueOnce(undefined);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(deployAppSettings.config.inputSchema!);
      const params = schema.parse({
        apps: [
          { app: "123", revision: "1" },
          { app: "456", revision: "2" },
        ],
      });

      const mockClient = createMockClient();
      mockClient.app.deployApp = mockDeployApp;

      const result = await deployAppSettings.callback(params, {
        client: mockClient,
      });

      expect(mockDeployApp).toHaveBeenCalledWith({
        apps: [
          { app: "123", revision: "1" },
          { app: "456", revision: "2" },
        ],
      });
      expect(result.structuredContent).toEqual({ success: true });
    });
  });
});
