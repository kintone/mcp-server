import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { deleteRecords } from "../delete-records.js";
import { z } from "zod";
import { mockExtra } from "../../../../__tests__/utils.js";

// Mock the KintoneRestAPIClient
const mockDeleteRecords = vi.fn();
vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: vi.fn().mockImplementation(() => ({
    record: {
      deleteRecords: mockDeleteRecords,
    },
  })),
}));

describe("delete-records tool", () => {
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
      expect(deleteRecords.name).toBe("kintone-delete-records");
    });

    it("should have correct description", () => {
      expect(deleteRecords.config.description).toBe(
        "Delete multiple records from a kintone app. Maximum 100 records can be deleted at once.",
      );
    });

    it("should have valid input schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(deleteRecords.config.inputSchema!);

      // Valid input
      const validInput = {
        app: "123",
        ids: ["100", "200", "300"],
      };
      expect(() => schema.parse(validInput)).not.toThrow();

      // Invalid input - missing fields
      expect(() => schema.parse({ app: "123" })).toThrow();
      expect(() => schema.parse({ ids: ["100"] })).toThrow();

      // Invalid input - wrong types
      expect(() =>
        schema.parse({
          app: 123, // should be string
          ids: ["100"],
        }),
      ).toThrow();

      expect(() =>
        schema.parse({
          app: "123",
          ids: [100], // should be array of strings
        }),
      ).toThrow();

      // Invalid input - empty array
      expect(() =>
        schema.parse({
          app: "123",
          ids: [],
        }),
      ).toThrow();

      // Invalid input - too many records (>100)
      const tooManyIds = Array.from({ length: 101 }, (_, i) => `${i + 1}`);
      expect(() =>
        schema.parse({
          app: "123",
          ids: tooManyIds,
        }),
      ).toThrow();
    });
  });

  describe("callback function", () => {
    it("should delete records successfully", async () => {
      mockDeleteRecords.mockResolvedValueOnce({});

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(deleteRecords.config.inputSchema!);
      const params = schema.parse({
        app: "123",
        ids: ["100", "200", "300"],
      });
      const result = await deleteRecords.callback(params, {
        client: { record: { deleteRecords: mockDeleteRecords } },
      });

      expect(mockDeleteRecords).toHaveBeenCalledWith({
        app: "123",
        ids: ["100", "200", "300"],
      });
      expect(result.content).toEqual([]);
    });
  });
});
