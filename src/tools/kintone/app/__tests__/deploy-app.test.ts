import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { deployApp } from "../deploy-app.js";
import { z } from "zod";
import { mockExtra, mockKintoneConfig } from "../../../../__tests__/utils.js";

const mockDeployApp = vi.fn();

vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: vi.fn().mockImplementation(() => ({
    app: { deployApp: mockDeployApp },
  })),
}));

vi.mock("../../../../config.js", () => ({
  parseKintoneClientConfig: vi.fn().mockReturnValue({
    config: {
      KINTONE_BASE_URL: "https://example.cybozu.com",
      KINTONE_USERNAME: "test-user",
      KINTONE_PASSWORD: "test-password",
      KINTONE_API_TOKEN: undefined,
      KINTONE_BASIC_AUTH_USERNAME: undefined,
      KINTONE_BASIC_AUTH_PASSWORD: undefined,
      HTTPS_PROXY: undefined,
      KINTONE_PFX_FILE_PATH: undefined,
      KINTONE_PFX_FILE_PASSWORD: undefined,
    },
    isApiTokenAuth: false,
  }),
  PACKAGE_NAME: "@kintone/mcp-server",
}));

vi.mock("../../../../version.js", () => ({
  version: "0.0.1",
}));

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
        "Deploy app settings to make them live in kintone",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(deployApp.config.inputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        {
          input: { apps: [{ app: 123 }] },
          description: "single app without revision",
        },
        {
          input: { apps: [{ app: "123" }] },
          description: "single app as string",
        },
        {
          input: { apps: [{ app: 123, revision: "5" }] },
          description: "single app with revision",
        },
        {
          input: {
            apps: [{ app: 123, revision: "5" }, { app: 456 }],
          },
          description: "multiple apps with mixed revision settings",
        },
        {
          input: { apps: [{ app: 123 }], revert: true },
          description: "with revert flag true",
        },
        {
          input: { apps: [{ app: 123 }], revert: false },
          description: "with revert flag false",
        },
        {
          input: { apps: [] },
          description: "empty apps array",
        },
      ])("accepts $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).not.toThrow();
      });
    });

    describe("input schema validation with invalid inputs", () => {
      it.each([
        {
          input: {},
          description: "missing required apps array",
        },
        {
          input: { apps: "123" },
          description: "apps as string instead of array",
        },
        {
          input: { apps: [{ app: true }] },
          description: "app as boolean",
        },
        {
          input: { apps: [{}] },
          description: "app object missing required app field",
        },
        {
          input: { apps: [{ app: 123, revision: 5 }] },
          description: "revision as number instead of string",
        },
        {
          input: { apps: [{ app: 123 }], revert: "true" },
          description: "revert as string instead of boolean",
        },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputSchema = z.object(deployApp.config.outputSchema!);

    describe("output schema validation", () => {
      it("accepts empty object", () => {
        expect(() => outputSchema.parse({})).not.toThrow();
      });
    });
  });

  describe("callback function", () => {
    it("should deploy single app without revision and revert", async () => {
      const mockResponse = {};
      mockDeployApp.mockResolvedValueOnce(mockResponse);

      const input = {
        apps: [{ app: 123 }],
      };

      const result = await deployApp.callback(input, mockExtra);

      expect(mockDeployApp).toHaveBeenCalledWith({
        apps: [{ app: 123 }],
      });
      expect(result.structuredContent).toEqual(mockResponse);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockResponse, null, 2),
      });
    });

    it("should deploy multiple apps with revisions", async () => {
      const mockResponse = {};
      mockDeployApp.mockResolvedValueOnce(mockResponse);

      const input = {
        apps: [
          { app: 123, revision: "5" },
          { app: "456", revision: "3" },
        ],
      };

      const result = await deployApp.callback(input, mockExtra);

      expect(mockDeployApp).toHaveBeenCalledWith({
        apps: [
          { app: 123, revision: "5" },
          { app: "456", revision: "3" },
        ],
      });
      expect(result.structuredContent).toEqual(mockResponse);
    });

    it("should deploy app with revert flag", async () => {
      const mockResponse = {};
      mockDeployApp.mockResolvedValueOnce(mockResponse);

      const input = {
        apps: [{ app: 789 }],
        revert: true,
      };

      const result = await deployApp.callback(input, mockExtra);

      expect(mockDeployApp).toHaveBeenCalledWith({
        apps: [{ app: 789 }],
        revert: true,
      });
      expect(result.structuredContent).toEqual(mockResponse);
    });

    it("should handle empty apps array", async () => {
      const mockResponse = {};
      mockDeployApp.mockResolvedValueOnce(mockResponse);

      const input = {
        apps: [],
      };

      const result = await deployApp.callback(input, mockExtra);

      expect(mockDeployApp).toHaveBeenCalledWith({
        apps: [],
      });
      expect(result.structuredContent).toEqual(mockResponse);
    });
  });
});
