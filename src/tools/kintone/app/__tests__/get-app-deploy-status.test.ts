import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAppDeployStatus } from "../get-app-deploy-status.js";
import { z } from "zod";
import { createMockClient } from "../../../../__tests__/utils.js";

// Mock function for getAppDeployStatus API call
const mockGetAppDeployStatus = vi.fn();

describe("get-app-deploy-status tool", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Set up environment variables for testing
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
      expect(getAppDeployStatus.name).toBe("kintone-get-app-deploy-status");
    });

    it("should have correct description", () => {
      expect(getAppDeployStatus.config.description).toBe(
        "Get app deploy status from kintone",
      );
    });

    it("should have valid input schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getAppDeployStatus.config.inputSchema!);

      // Valid input
      const validInput = {
        apps: ["123", "456"],
      };
      expect(() => schema.parse(validInput)).not.toThrow();

      // Valid input with single app
      const singleAppInput = {
        apps: ["123"],
      };
      expect(() => schema.parse(singleAppInput)).not.toThrow();

      // Valid input with numeric app IDs
      const numericAppInput = {
        apps: [123, 456],
      };
      expect(() => schema.parse(numericAppInput)).not.toThrow();

      // Valid input with mixed string and numeric app IDs
      const mixedAppInput = {
        apps: ["123", 456],
      };
      expect(() => schema.parse(mixedAppInput)).not.toThrow();

      // Invalid input - missing fields
      expect(() => schema.parse({})).toThrow();

      // Invalid input - empty array
      expect(() =>
        schema.parse({
          apps: [],
        }),
      ).toThrow();

      // Invalid input - wrong types
      expect(() =>
        schema.parse({
          apps: [true], // should be string or number
        }),
      ).toThrow();

      // Invalid input - too many apps (over 300)
      const tooManyApps = Array.from({ length: 301 }, (_, i) => i.toString());
      expect(() =>
        schema.parse({
          apps: tooManyApps,
        }),
      ).toThrow();
    });

    it("should have valid output schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getAppDeployStatus.config.outputSchema!);

      // Valid output
      const validOutput = {
        apps: [
          {
            app: "123",
            status: "SUCCESS",
          },
          {
            app: "456",
            status: "PROCESSING",
          },
        ],
      };
      expect(() => schema.parse(validOutput)).not.toThrow();

      // Valid output with all status types
      const allStatusOutput = {
        apps: [
          { app: "1", status: "PROCESSING" },
          { app: "2", status: "SUCCESS" },
          { app: "3", status: "FAIL" },
          { app: "4", status: "CANCEL" },
        ],
      };
      expect(() => schema.parse(allStatusOutput)).not.toThrow();

      // Invalid output - missing required fields
      expect(() => schema.parse({ apps: [{ app: "123" }] })).toThrow();

      // Invalid output - invalid status
      expect(() =>
        schema.parse({
          apps: [{ app: "123", status: "INVALID_STATUS" }],
        }),
      ).toThrow();
    });
  });

  describe("callback function", () => {
    it("should retrieve app deploy status successfully", async () => {
      const mockDeployStatusData = {
        apps: [
          {
            app: "123",
            status: "SUCCESS",
          },
          {
            app: "456",
            status: "PROCESSING",
          },
        ],
      };

      mockGetAppDeployStatus.mockResolvedValueOnce(mockDeployStatusData);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getAppDeployStatus.config.inputSchema!);
      const params = schema.parse({
        apps: ["123", "456"],
      });

      const mockClient = createMockClient();
      mockClient.app.getDeployStatus = mockGetAppDeployStatus;

      const result = await getAppDeployStatus.callback(params, {
        client: mockClient,
      });

      expect(mockGetAppDeployStatus).toHaveBeenCalledWith({
        apps: ["123", "456"],
      });
      expect(result.structuredContent).toEqual(mockDeployStatusData);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockDeployStatusData, null, 2),
      });
    });

    it("should handle single app deploy status", async () => {
      const mockDeployStatusData = {
        apps: [
          {
            app: "123",
            status: "FAIL",
          },
        ],
      };

      mockGetAppDeployStatus.mockResolvedValueOnce(mockDeployStatusData);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getAppDeployStatus.config.inputSchema!);
      const params = schema.parse({
        apps: ["123"],
      });

      const mockClient = createMockClient();
      mockClient.app.getDeployStatus = mockGetAppDeployStatus;

      const result = await getAppDeployStatus.callback(params, {
        client: mockClient,
      });

      expect(mockGetAppDeployStatus).toHaveBeenCalledWith({
        apps: ["123"],
      });
      expect(result.structuredContent).toEqual(mockDeployStatusData);
    });

    it("should handle numeric app IDs", async () => {
      const mockDeployStatusData = {
        apps: [
          {
            app: "123",
            status: "SUCCESS",
          },
          {
            app: "456",
            status: "PROCESSING",
          },
        ],
      };

      mockGetAppDeployStatus.mockResolvedValueOnce(mockDeployStatusData);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getAppDeployStatus.config.inputSchema!);
      const params = schema.parse({
        apps: [123, 456],
      });

      const mockClient = createMockClient();
      mockClient.app.getDeployStatus = mockGetAppDeployStatus;

      const result = await getAppDeployStatus.callback(params, {
        client: mockClient,
      });

      expect(mockGetAppDeployStatus).toHaveBeenCalledWith({
        apps: [123, 456],
      });
      expect(result.structuredContent).toEqual(mockDeployStatusData);
    });

    it("should handle mixed string and numeric app IDs", async () => {
      const mockDeployStatusData = {
        apps: [
          {
            app: "123",
            status: "SUCCESS",
          },
          {
            app: "456",
            status: "FAIL",
          },
        ],
      };

      mockGetAppDeployStatus.mockResolvedValueOnce(mockDeployStatusData);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getAppDeployStatus.config.inputSchema!);
      const params = schema.parse({
        apps: ["123", 456],
      });

      const mockClient = createMockClient();
      mockClient.app.getDeployStatus = mockGetAppDeployStatus;

      const result = await getAppDeployStatus.callback(params, {
        client: mockClient,
      });

      expect(mockGetAppDeployStatus).toHaveBeenCalledWith({
        apps: ["123", 456],
      });
      expect(result.structuredContent).toEqual(mockDeployStatusData);
    });

    it("should handle all status types", async () => {
      const mockDeployStatusData = {
        apps: [
          { app: "1", status: "PROCESSING" },
          { app: "2", status: "SUCCESS" },
          { app: "3", status: "FAIL" },
          { app: "4", status: "CANCEL" },
        ],
      };

      mockGetAppDeployStatus.mockResolvedValueOnce(mockDeployStatusData);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getAppDeployStatus.config.inputSchema!);
      const params = schema.parse({
        apps: ["1", "2", "3", "4"],
      });

      const mockClient = createMockClient();
      mockClient.app.getDeployStatus = mockGetAppDeployStatus;

      const result = await getAppDeployStatus.callback(params, {
        client: mockClient,
      });

      expect(mockGetAppDeployStatus).toHaveBeenCalledWith({
        apps: ["1", "2", "3", "4"],
      });
      expect(result.structuredContent).toEqual(mockDeployStatusData);
    });

    it("should handle API errors", async () => {
      const errorMessage = "API Error";
      mockGetAppDeployStatus.mockRejectedValueOnce(new Error(errorMessage));

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getAppDeployStatus.config.inputSchema!);
      const params = schema.parse({
        apps: ["123"],
      });

      const mockClient = createMockClient();
      mockClient.app.getDeployStatus = mockGetAppDeployStatus;

      await expect(
        getAppDeployStatus.callback(params, {
          client: mockClient,
        }),
      ).rejects.toThrow(errorMessage);
    });
  });
});
