import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getApp } from "../get-app.js";
import { z } from "zod";
import { mockExtra } from "../../../../__tests__/utils.js";

// Mock the KintoneRestAPIClient
const mockGetApp = vi.fn();
vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: vi.fn().mockImplementation(() => ({
    app: {
      getApp: mockGetApp,
    },
  })),
}));

describe("get-app tool", () => {
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
      expect(getApp.name).toBe("kintone-get-app");
    });

    it("should have correct description", () => {
      expect(getApp.config.description).toBe("Get app settings from kintone");
    });

    it("should have valid input schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getApp.config.inputSchema!);

      // Valid input
      const validInput = {
        appId: 123,
      };
      expect(() => schema.parse(validInput)).not.toThrow();

      // Invalid input - missing fields
      expect(() => schema.parse({})).toThrow();

      // Invalid input - wrong types
      expect(() =>
        schema.parse({
          appId: "123", // should be number
        }),
      ).toThrow();
    });

    it("should have valid output schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getApp.config.outputSchema!);

      // Valid output
      const validOutput = {
        appId: "123",
        code: "APP123",
        name: "Test App",
        description: "Test Description",
        spaceId: "10",
        threadId: "20",
        createdAt: "2024-01-01T00:00:00Z",
        creator: {
          code: "user1",
          name: "Test User",
        },
        modifiedAt: "2024-01-02T00:00:00Z",
        modifier: {
          code: "user2",
          name: "Another User",
        },
      };
      expect(() => schema.parse(validOutput)).not.toThrow();

      // Valid output with null spaceId and threadId
      const validOutputWithNull = {
        ...validOutput,
        spaceId: null,
        threadId: null,
      };
      expect(() => schema.parse(validOutputWithNull)).not.toThrow();

      // Invalid output - missing required fields
      expect(() => schema.parse({ appId: "123" })).toThrow();
      expect(() =>
        schema.parse({ ...validOutput, creator: { code: "user1" } }),
      ).toThrow(); // missing name in creator
    });
  });

  describe("callback function", () => {
    it("should retrieve app information successfully", async () => {
      const mockAppData = {
        appId: "123",
        code: "APP123",
        name: "Test App",
        description: "Test Description",
        spaceId: "10",
        threadId: "20",
        createdAt: "2024-01-01T00:00:00Z",
        creator: {
          code: "user1",
          name: "Test User",
        },
        modifiedAt: "2024-01-02T00:00:00Z",
        modifier: {
          code: "user2",
          name: "Another User",
        },
      };

      mockGetApp.mockResolvedValueOnce(mockAppData);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getApp.config.inputSchema!);
      const params = schema.parse({
        appId: 123,
      });
      const result = await getApp.callback(params, mockExtra);

      expect(mockGetApp).toHaveBeenCalledWith({ id: 123 });
      expect(result.structuredContent).toEqual(mockAppData);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockAppData, null, 2),
      });
    });
  });
});
