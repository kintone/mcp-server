import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { deleteSpace } from "../delete-space.js";
import { createMockClient } from "../../../../__tests__/utils.js";

const mockDeleteSpace = vi.fn();

describe("delete-space tool", () => {
  const originalEnv = process.env;

  beforeEach(() => {
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
      expect(deleteSpace.name).toBe("kintone-delete-space");
    });

    it("should have correct description", () => {
      expect(deleteSpace.config.description).toBe(
        "Delete a kintone space via the Space REST API (DELETE /k/v1/space.json). " +
          "Destructive and irreversible: permanently removes the target space along with all of its threads, comments, and the apps and records that belong to the space. " +
          "Requires space administrator privileges on the target space. " +
          "The deletion is applied immediately to the production environment (no deploy step) and cannot be undone from this tool. " +
          "The API returns an empty body on success.",
      );
    });

    it("should have valid input schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(deleteSpace.config.inputSchema!);

      expect(() => schema.parse({ id: "1" })).not.toThrow();
      expect(() => schema.parse({})).toThrow();
      expect(() => schema.parse({ id: 1 })).toThrow();
    });
  });

  describe("callback function", () => {
    it("should call deleteSpace and return empty content", async () => {
      mockDeleteSpace.mockResolvedValueOnce({});

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const input = z.object(deleteSpace.config.inputSchema!).parse({
        id: "99",
      });

      const mockClient = createMockClient();
      mockClient.space.deleteSpace = mockDeleteSpace;

      const result = await deleteSpace.callback(input, {
        client: mockClient,
      });

      expect(mockDeleteSpace).toHaveBeenCalledWith({ id: "99" });
      expect(result.structuredContent).toEqual({});
      expect(result.content).toEqual([]);
    });

    it("should propagate errors from the API", async () => {
      const mockError = new Error("API Error: Space not found");
      mockDeleteSpace.mockRejectedValueOnce(mockError);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const input = z.object(deleteSpace.config.inputSchema!).parse({
        id: "999",
      });

      const mockClient = createMockClient();
      mockClient.space.deleteSpace = mockDeleteSpace;

      await expect(
        deleteSpace.callback(input, { client: mockClient }),
      ).rejects.toThrow("API Error: Space not found");
    });
  });
});
