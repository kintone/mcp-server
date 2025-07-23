import { describe, it, expect, vi, beforeEach } from "vitest";
import { getApp } from "../get-app.js";
import { z } from "zod";
import { mockExtra } from "../../../__tests__/utils.js";

// Mock the KintoneRestAPIClient
vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: vi.fn().mockImplementation(() => ({
    app: {
      getApp: vi.fn(),
    },
  })),
}));

describe("get-app tool", () => {
  let mockGetApp: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { KintoneRestAPIClient } = vi.mocked(
      await import("@kintone/rest-api-client"),
    );
    mockGetApp = vi.fn();
    (KintoneRestAPIClient as any).mockImplementation(() => ({
      app: {
        getApp: mockGetApp,
      },
    }));
  });

  describe("tool configuration", () => {
    it("should have correct name", () => {
      expect(getApp.name).toBe("kintone-get-app");
    });

    it("should have correct description", () => {
      expect(getApp.config.description).toBe("Get app settings from kintone");
    });

    it("should have valid input schema", () => {
      const schema = z.object(getApp.config.inputSchema!);

      // Valid input
      const validInput = {
        baseUrl: "https://example.cybozu.com",
        username: "testuser",
        password: "testpass",
        appId: 123,
      };
      expect(() => schema.parse(validInput)).not.toThrow();

      // Invalid input - missing fields
      expect(() =>
        schema.parse({
          baseUrl: "https://example.cybozu.com",
          username: "testuser",
          password: "testpass",
        }),
      ).toThrow();
      expect(() =>
        schema.parse({
          username: "testuser",
          password: "testpass",
          appId: 123,
        }),
      ).toThrow();

      // Invalid input - wrong types
      expect(() =>
        schema.parse({
          baseUrl: 123, // should be string
          username: "testuser",
          password: "testpass",
          appId: 123,
        }),
      ).toThrow();
      expect(() =>
        schema.parse({
          baseUrl: "https://example.cybozu.com",
          username: "testuser",
          password: "testpass",
          appId: "123", // should be number
        }),
      ).toThrow();
    });

    it("should have valid output schema", () => {
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

  describe("handler function", () => {
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

      const result = await getApp.callback(
        {
          baseUrl: "https://example.cybozu.com",
          username: "testuser",
          password: "testpass",
          appId: 123,
        },
        mockExtra,
      );

      expect(mockGetApp).toHaveBeenCalledWith({ id: 123 });
      expect(result.structuredContent).toEqual(mockAppData);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockAppData, null, 2),
      });
    });

    it("should handle app with empty description and code", async () => {
      const mockAppData = {
        appId: "456",
        code: "",
        name: "Minimal App",
        description: "",
        spaceId: null,
        threadId: null,
        createdAt: "2024-01-01T00:00:00Z",
        creator: {
          code: "user1",
          name: "Test User",
        },
        modifiedAt: "2024-01-02T00:00:00Z",
        modifier: {
          code: "user1",
          name: "Test User",
        },
      };

      mockGetApp.mockResolvedValueOnce(mockAppData);

      const result = await getApp.callback(
        {
          baseUrl: "https://example.cybozu.com",
          username: "testuser",
          password: "testpass",
          appId: 456,
        },
        mockExtra,
      );

      expect(result.structuredContent).toEqual(mockAppData);
    });

    it("should pass through different baseUrl correctly", async () => {
      const mockAppData = {
        appId: "789",
        code: "APP789",
        name: "Another App",
        description: "Another Description",
        spaceId: "30",
        threadId: "40",
        createdAt: "2024-01-01T00:00:00Z",
        creator: {
          code: "admin",
          name: "Admin User",
        },
        modifiedAt: "2024-01-02T00:00:00Z",
        modifier: {
          code: "admin",
          name: "Admin User",
        },
      };

      mockGetApp.mockResolvedValueOnce(mockAppData);

      const result = await getApp.callback(
        {
          baseUrl: "https://custom.kintone.com",
          username: "admin",
          password: "adminpass",
          appId: 789,
        },
        mockExtra,
      );

      // Verify the client was created with correct baseUrl
      const { KintoneRestAPIClient } = vi.mocked(
        await import("@kintone/rest-api-client"),
      );
      expect(KintoneRestAPIClient).toHaveBeenCalledWith({
        baseUrl: "https://custom.kintone.com",
        auth: {
          username: "admin",
          password: "adminpass",
        },
      });

      expect(result.structuredContent).toEqual(mockAppData);
    });
  });
});