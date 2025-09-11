import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { addApp } from "../add-app.js";
import { z } from "zod";
import { createMockClient } from "../../../../__tests__/utils.js";

const mockAddApp = vi.fn();

describe("add-app tool", () => {
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
      expect(addApp.name).toBe("kintone-add-app");
    });

    it("should have correct description", () => {
      expect(addApp.config.description).toBe(
        "Create a new app in the pre-live environment on kintone",
      );
    });

    it("should have valid input schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(addApp.config.inputSchema!);

      const validInput = {
        name: "Test App",
      };
      expect(() => schema.parse(validInput)).not.toThrow();

      const validInputWithOptionals = {
        name: "Test App",
        space: 10,
      };
      expect(() => schema.parse(validInputWithOptionals)).not.toThrow();

      expect(() => schema.parse({})).toThrow();

      expect(() =>
        schema.parse({
          name: "A".repeat(65), // exceeds max length
        }),
      ).toThrow();
    });

    it("should have valid output schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(addApp.config.outputSchema!);

      const validOutput = {
        app: "123",
        revision: "1",
      };
      expect(() => schema.parse(validOutput)).not.toThrow();

      expect(() => schema.parse({ app: "123" })).toThrow();
    });
  });

  describe("callback function", () => {
    it("should create app successfully with required fields only", async () => {
      const mockAppData = {
        app: "123",
        revision: "1",
      };

      mockAddApp.mockResolvedValueOnce(mockAppData);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(addApp.config.inputSchema!);
      const params = schema.parse({
        name: "Test App",
      });

      const mockClient = createMockClient();
      mockClient.app.addApp = mockAddApp;

      const result = await addApp.callback(params, {
        client: mockClient,
      });

      expect(mockAddApp).toHaveBeenCalledWith({ name: "Test App" });
      expect(result.structuredContent).toEqual(mockAppData);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockAppData, null, 2),
      });
    });

    it("should create app successfully with all optional fields", async () => {
      const mockAppData = {
        app: "123",
        revision: "1",
      };

      mockAddApp.mockResolvedValueOnce(mockAppData);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(addApp.config.inputSchema!);
      const params = schema.parse({
        name: "Test App",
        space: 10,
      });

      const mockClient = createMockClient();
      mockClient.app.addApp = mockAddApp;

      const result = await addApp.callback(params, {
        client: mockClient,
      });

      expect(mockAddApp).toHaveBeenCalledWith({
        name: "Test App",
        space: 10,
      });
      expect(result.structuredContent).toEqual(mockAppData);
    });
  });
});
