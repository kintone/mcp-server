import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { addFormFields } from "../add-form-fields.js";
import { z } from "zod";
import { mockExtra, mockKintoneConfig } from "../../../../__tests__/utils.js";

const mockAddFormFields = vi.fn();

vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: vi.fn().mockImplementation(() => ({
    app: { addFormFields: mockAddFormFields },
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

describe("add-form-fields tool", () => {
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
      expect(addFormFields.name).toBe("kintone-add-form-fields");
    });

    it("should have correct description", () => {
      expect(addFormFields.config.description).toBe(
        "Add form fields to a kintone app",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(addFormFields.config.inputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        {
          input: {
            app: 123,
            properties: {
              text_field: {
                type: "SINGLE_LINE_TEXT",
                code: "text_field",
                label: "Text Field",
                noLabel: false,
                required: true,
              },
            },
          },
          description: "basic single line text field",
        },
        {
          input: {
            app: "123",
            properties: {
              radio_field: {
                type: "RADIO_BUTTON",
                code: "radio_field",
                label: "Radio Field",
                noLabel: false,
                required: false,
                options: {
                  option1: { label: "option1", index: "0" },
                  option2: { label: "option2", index: "1" },
                },
                defaultValue: "option1",
                align: "HORIZONTAL",
              },
            },
          },
          description: "radio button field with options",
        },
        {
          input: {
            app: 456,
            properties: {
              dropdown_field: {
                type: "DROP_DOWN",
                code: "dropdown_field",
                label: "Dropdown Field",
                noLabel: false,
                required: true,
                options: {
                  choice1: { label: "choice1", index: "0" },
                  choice2: { label: "choice2", index: "1" },
                },
              },
            },
            revision: "5",
          },
          description: "dropdown field with revision",
        },
      ])("accepts $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).not.toThrow();
      });
    });

    describe("input schema validation with invalid inputs", () => {
      it.each([
        {
          input: {},
          description: "missing required app and properties fields",
        },
        {
          input: { app: 123 },
          description: "missing required properties field",
        },
        {
          input: { properties: {} },
          description: "missing required app field",
        },
        {
          input: { app: true, properties: {} },
          description: "app as boolean",
        },
        {
          input: { app: 123, properties: "invalid" },
          description: "properties as string",
        },
        {
          input: { app: 123, properties: {}, revision: 123 },
          description: "revision as number instead of string",
        },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputSchema = z.object(addFormFields.config.outputSchema!);

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
    it("should add form fields without revision", async () => {
      const mockResponse = { revision: "2" };
      mockAddFormFields.mockResolvedValueOnce(mockResponse);

      const input = {
        app: 123,
        properties: {
          text_field: {
            type: "SINGLE_LINE_TEXT",
            code: "text_field",
            label: "Text Field",
            noLabel: false,
            required: true,
          },
        },
      };

      const result = await addFormFields.callback(input, mockExtra);

      expect(mockAddFormFields).toHaveBeenCalledWith({
        app: 123,
        properties: input.properties,
      });
      expect(result.structuredContent).toEqual(mockResponse);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockResponse, null, 2),
      });
    });

    it("should add form fields with revision", async () => {
      const mockResponse = { revision: "6" };
      mockAddFormFields.mockResolvedValueOnce(mockResponse);

      const input = {
        app: "456",
        properties: {
          radio_field: {
            type: "RADIO_BUTTON",
            code: "radio_field",
            label: "Radio Field",
            noLabel: false,
            required: false,
            options: {
              yes: { label: "yes", index: "0" },
              no: { label: "no", index: "1" },
            },
            defaultValue: "yes",
            align: "VERTICAL",
          },
        },
        revision: "5",
      };

      const result = await addFormFields.callback(input, mockExtra);

      expect(mockAddFormFields).toHaveBeenCalledWith({
        app: "456",
        properties: input.properties,
        revision: "5",
      });
      expect(result.structuredContent).toEqual(mockResponse);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockResponse, null, 2),
      });
    });
  });
});
