import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { deleteFormFields } from "../delete-form-fields.js";
import { z } from "zod";
import { mockExtra, mockKintoneConfig } from "../../../../__tests__/utils.js";

const mockDeleteFormFields = vi.fn();

vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: vi.fn().mockImplementation(() => ({
    app: { deleteFormFields: mockDeleteFormFields },
  })),
}));

vi.mock("../../../../config.js", () => ({
  parseKintoneClientConfig: vi.fn().mockReturnValue({
    KINTONE_BASE_URL: "https://example.cybozu.com",
    KINTONE_USERNAME: "test-user",
    KINTONE_PASSWORD: "test-password",
  }),
  PACKAGE_NAME: "@kintone/mcp-server",
}));

vi.mock("../../../../version.js", () => ({
  version: "0.0.1",
}));

describe("delete-form-fields tool", () => {
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
      expect(deleteFormFields.name).toBe("kintone-delete-form-fields");
    });

    it("should have correct description", () => {
      expect(deleteFormFields.config.description).toBe(
        "Delete form fields from a kintone app",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(deleteFormFields.config.inputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        {
          input: { app: 123, fields: ["field1"] },
          description: "app as number with single field",
        },
        {
          input: { app: "123", fields: ["field1", "field2"] },
          description: "app as string with multiple fields",
        },
        {
          input: { app: 456, fields: ["field1"], revision: "5" },
          description: "with revision number",
        },
        {
          input: { app: 789, fields: [] },
          description: "with empty fields array",
        },
      ])("accepts $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).not.toThrow();
      });
    });

    describe("input schema validation with invalid inputs", () => {
      it.each([
        {
          input: {},
          description: "missing required app and fields",
        },
        {
          input: { app: 123 },
          description: "missing required fields array",
        },
        {
          input: { fields: ["field1"] },
          description: "missing required app",
        },
        {
          input: { app: true, fields: ["field1"] },
          description: "app as boolean",
        },
        {
          input: { app: 123, fields: "field1" },
          description: "fields as string instead of array",
        },
        {
          input: { app: 123, fields: [123] },
          description: "fields array with number instead of string",
        },
        {
          input: { app: 123, fields: ["field1"], revision: 5 },
          description: "revision as number instead of string",
        },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputSchema = z.object(deleteFormFields.config.outputSchema!);

    describe("output schema validation with valid outputs", () => {
      it.each([
        {
          output: { revision: "1" },
          description: "basic revision",
        },
        {
          output: { revision: "10" },
          description: "higher revision number",
        },
      ])("accepts $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).not.toThrow();
      });
    });

    describe("output schema validation with invalid outputs", () => {
      it.each([
        {
          output: {},
          description: "missing revision field",
        },
        {
          output: { revision: 123 },
          description: "revision as number instead of string",
        },
        {
          output: { revision: null },
          description: "revision as null",
        },
      ])("rejects $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).toThrow();
      });
    });
  });

  describe("callback function", () => {
    it("should delete form fields without revision", async () => {
      const mockResponse = { revision: "2" };
      mockDeleteFormFields.mockResolvedValueOnce(mockResponse);

      const input = {
        app: 123,
        fields: ["text_field", "number_field"],
      };

      const result = await deleteFormFields.callback(input, mockExtra);

      expect(mockDeleteFormFields).toHaveBeenCalledWith({
        app: 123,
        fields: ["text_field", "number_field"],
      });
      expect(result.structuredContent).toEqual(mockResponse);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockResponse, null, 2),
      });
    });

    it("should delete form fields with revision", async () => {
      const mockResponse = { revision: "6" };
      mockDeleteFormFields.mockResolvedValueOnce(mockResponse);

      const input = {
        app: "456",
        fields: ["old_field"],
        revision: "5",
      };

      const result = await deleteFormFields.callback(input, mockExtra);

      expect(mockDeleteFormFields).toHaveBeenCalledWith({
        app: "456",
        fields: ["old_field"],
        revision: "5",
      });
      expect(result.structuredContent).toEqual(mockResponse);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockResponse, null, 2),
      });
    });

    it("should handle empty fields array", async () => {
      const mockResponse = { revision: "3" };
      mockDeleteFormFields.mockResolvedValueOnce(mockResponse);

      const input = {
        app: 789,
        fields: [],
      };

      const result = await deleteFormFields.callback(input, mockExtra);

      expect(mockDeleteFormFields).toHaveBeenCalledWith({
        app: 789,
        fields: [],
      });
      expect(result.structuredContent).toEqual(mockResponse);
    });
  });
});
