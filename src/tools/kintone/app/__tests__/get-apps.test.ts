import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { mockExtra } from "../../../../__tests__/utils.js";

// Mock the KintoneRestAPIClient
const mockGetApps = vi.fn();
vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: vi.fn().mockImplementation(() => ({
    app: {
      getApps: mockGetApps,
    },
  })),
}));

describe("get-apps tool - main functionality", () => {
  let getApps: any;
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

    // Reset modules and re-import to get fresh instance
    vi.resetModules();
    const module = await import("../get-apps.js");
    getApps = module.getApps;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("tool configuration", () => {
    it("should have correct name", () => {
      expect(getApps.name).toBe("kintone-get-apps");
    });

    it("should have correct description", () => {
      expect(getApps.config.description).toBe(
        "Get multiple app settings from kintone",
      );
    });

    it("should have valid input schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getApps.config.inputSchema!);

      // Valid input - all fields
      const validInput = {
        ids: [1, 2, 3],
        codes: ["APP1", "APP2"],
        name: "Test",
        spaceIds: [10, 20],
        offset: 0,
        limit: 50,
      };
      expect(() => schema.parse(validInput)).not.toThrow();

      // Valid input - empty object (all fields are optional)
      expect(() => schema.parse({})).not.toThrow();

      // Valid input - partial fields
      const partialInput = {
        name: "Search Name",
        limit: 20,
      };
      expect(() => schema.parse(partialInput)).not.toThrow();

      // Invalid input - wrong types
      expect(() =>
        schema.parse({
          ids: ["1", "2"], // should be numbers
        }),
      ).toThrow();

      expect(() =>
        schema.parse({
          limit: 200, // exceeds max of 100
        }),
      ).toThrow();

      expect(() =>
        schema.parse({
          limit: 0, // below min of 1
        }),
      ).toThrow();

      expect(() =>
        schema.parse({
          codes: ["A".repeat(65)], // exceeds max length of 64
        }),
      ).toThrow();
    });

    it("should have valid output schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getApps.config.outputSchema!);

      // Valid output
      const validOutput = {
        apps: [
          {
            appId: "123",
            code: "APP123",
            name: "Test App 1",
            description: "Test Description 1",
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
          },
          {
            appId: "456",
            code: "",
            name: "Test App 2",
            description: "",
            spaceId: null,
            threadId: null,
            createdAt: "2024-01-03T00:00:00Z",
            creator: {
              code: "user3",
              name: "Third User",
            },
            modifiedAt: "2024-01-04T00:00:00Z",
            modifier: {
              code: "user3",
              name: "Third User",
            },
          },
        ],
      };
      expect(() => schema.parse(validOutput)).not.toThrow();

      // Valid output - empty apps array
      const emptyOutput = {
        apps: [],
      };
      expect(() => schema.parse(emptyOutput)).not.toThrow();

      // Invalid output - missing apps field
      expect(() => schema.parse({})).toThrow();

      // Invalid output - invalid app structure
      expect(() =>
        schema.parse({
          apps: [{ appId: "123" }], // missing required fields
        }),
      ).toThrow();
    });
  });

  describe("callback function", () => {
    it("should retrieve apps information successfully", async () => {
      const mockAppsData = {
        apps: [
          {
            appId: "123",
            code: "APP123",
            name: "Test App 1",
            description: "Test Description 1",
            spaceId: "10",
            threadId: "20",
            createdAt: "2024-01-01T00:00:00Z",
            creator: {
              code: "user1",
              name: "Test User 1",
            },
            modifiedAt: "2024-01-02T00:00:00Z",
            modifier: {
              code: "user2",
              name: "Test User 2",
            },
          },
          {
            appId: "456",
            code: "APP456",
            name: "Test App 2",
            description: "Test Description 2",
            spaceId: null,
            threadId: null,
            createdAt: "2024-01-03T00:00:00Z",
            creator: {
              code: "user3",
              name: "Test User 3",
            },
            modifiedAt: "2024-01-04T00:00:00Z",
            modifier: {
              code: "user3",
              name: "Test User 3",
            },
          },
        ],
      };

      mockGetApps.mockResolvedValueOnce(mockAppsData);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getApps.config.inputSchema!);
      const params = schema.parse({});

      const result = await getApps.callback(params, mockExtra);

      expect(mockGetApps).toHaveBeenCalledWith({ limit: 100, offset: 0 });
      expect(result.structuredContent).toEqual(mockAppsData);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockAppsData, null, 2),
      });
    });

    it("should retrieve apps with filters", async () => {
      const mockAppsData = {
        apps: [
          {
            appId: "789",
            code: "APP789",
            name: "Filtered App",
            description: "Filtered Description",
            spaceId: "30",
            threadId: "40",
            createdAt: "2024-01-05T00:00:00Z",
            creator: {
              code: "admin",
              name: "Admin User",
            },
            modifiedAt: "2024-01-06T00:00:00Z",
            modifier: {
              code: "admin",
              name: "Admin User",
            },
          },
        ],
      };

      mockGetApps.mockResolvedValueOnce(mockAppsData);

      const result = await getApps.callback(
        {
          ids: [789],
          codes: ["APP789"],
          name: "Filtered",
          spaceIds: [30],
          offset: 10,
          limit: 50,
        },
        mockExtra,
      );

      expect(mockGetApps).toHaveBeenCalledWith({
        ids: [789],
        codes: ["APP789"],
        name: "Filtered",
        spaceIds: [30],
        offset: 10,
        limit: 50,
      });
      expect(result.structuredContent).toEqual(mockAppsData);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockAppsData, null, 2),
      });
    });
  });
});
