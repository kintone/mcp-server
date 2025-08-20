import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getProcessManagement } from "../get-process-management.js";
import { z } from "zod";
import { mockExtra, mockKintoneConfig } from "../../../../__tests__/utils.js";

// Mock the KintoneRestAPIClient
const mockGetProcessManagement = vi.fn();
vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: vi.fn().mockImplementation(() => ({
    app: {
      getProcessManagement: mockGetProcessManagement,
    },
  })),
}));

describe("get-process-management tool", () => {
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
      expect(getProcessManagement.name).toBe("kintone-get-process-management");
    });

    it("should have correct description", () => {
      expect(getProcessManagement.config.description).toBe(
        "Get process management settings from a kintone app",
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const inputSchema = z.object(getProcessManagement.config.inputSchema!);

    describe("input schema validation with valid inputs", () => {
      it.each([
        { input: { app: "123" }, description: "app as string" },
        { input: { app: "456", lang: "ja" }, description: "with lang ja" },
        { input: { app: "456", lang: "en" }, description: "with lang en" },
        { input: { app: "456", lang: "zh" }, description: "with lang zh" },
        {
          input: { app: "456", lang: "default" },
          description: "with lang default",
        },
        { input: { app: "456", lang: "user" }, description: "with lang user" },
      ])("accepts $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).not.toThrow();
      });
    });

    describe("input schema validation with invalid inputs", () => {
      it.each([
        { input: {}, description: "missing required app field" },
        { input: { app: true }, description: "app as boolean" },
        { input: { app: null }, description: "app as null" },
        { input: { app: [] }, description: "app as array" },
        { input: { app: 123 }, description: "app as number" },
        { input: { app: "123", lang: 123 }, description: "lang as number" },
        {
          input: { app: "123", lang: "fr" },
          description: "invalid lang value",
        },
        { input: { app: "123", lang: null }, description: "lang as null" },
      ])("rejects $description", ({ input }) => {
        expect(() => inputSchema.parse(input)).toThrow();
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const outputSchema = z.object(getProcessManagement.config.outputSchema!);

    describe("output schema validation with valid outputs", () => {
      it.each([
        {
          output: {
            enable: true,
            states: {
              "Not started": {
                name: "Not started",
                index: "0",
                assignee: {
                  type: "ONE",
                  entities: [
                    {
                      entity: { type: "CREATOR", code: null },
                      includeSubs: false,
                    },
                  ],
                },
              },
            },
            actions: [
              {
                name: "Start",
                from: "Not started",
                to: "In progress",
                filterCond: "",
                type: "PRIMARY",
              },
            ],
            revision: "1",
          },
          description: "basic process management settings",
        },
        {
          output: {
            enable: false,
            states: null,
            actions: null,
            revision: "1",
          },
          description: "disabled process management with null values",
        },
        {
          output: {
            enable: false,
            states: {},
            actions: [],
            revision: "1",
          },
          description: "disabled process management with empty objects",
        },
        {
          output: {
            enable: true,
            states: {
              "In review": {
                name: "In review",
                index: "1",
                assignee: {
                  type: "ALL",
                  entities: [
                    {
                      entity: { type: "USER", code: "user1" },
                      includeSubs: false,
                    },
                  ],
                },
              },
            },
            actions: [
              {
                name: "Submit for review",
                from: "Draft",
                to: "In review",
                filterCond: "status = 'ready'",
                type: "PRIMARY",
              },
            ],
            revision: "2",
          },
          description: "with filter condition and assignee",
        },
        {
          output: {
            enable: true,
            states: {
              Processing: {
                name: "Processing",
                index: "2",
                assignee: {
                  type: "ANY",
                  entities: [
                    {
                      entity: { type: "FIELD_ENTITY", code: "assignee_field" },
                      includeSubs: false,
                    },
                  ],
                },
              },
            },
            actions: [],
            revision: "3",
          },
          description: "with field entity assignee",
        },
      ])("accepts $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).not.toThrow();
      });
    });

    describe("output schema validation with invalid outputs", () => {
      it.each([
        {
          output: {},
          description: "missing all required fields",
        },
        {
          output: { enable: true, states: {}, actions: [] },
          description: "missing revision field",
        },
        {
          output: { enable: true, revision: "1" },
          description: "missing states and actions fields",
        },
        {
          output: {
            enable: "true", // should be boolean
            states: {},
            actions: [],
            revision: "1",
          },
          description: "enable as string instead of boolean",
        },
        {
          output: {
            enable: true,
            states: {
              Invalid: {
                // missing required fields
                index: "0",
              },
            },
            actions: [],
            revision: "1",
          },
          description: "state missing required name field",
        },
        {
          output: {
            enable: true,
            states: {},
            actions: [
              {
                name: "Action",
                // missing required from, to, filterCond and type fields
              },
            ],
            revision: "1",
          },
          description: "action missing required from and to fields",
        },
      ])("rejects $description", ({ output }) => {
        expect(() => outputSchema.parse(output)).toThrow();
      });
    });
  });

  describe("callback function", () => {
    it("should call API and return formatted response", async () => {
      const mockData = {
        enable: true,
        states: {
          "Not started": {
            name: "Not started",
            index: "0",
            assignee: {
              type: "ONE",
              entities: [
                {
                  entity: { type: "CREATOR", code: null },
                  includeSubs: false,
                },
              ],
            },
          },
          "In progress": {
            name: "In progress",
            index: "1",
          },
        },
        actions: [
          {
            name: "Start",
            from: "Not started",
            to: "In progress",
            filterCond: "",
            type: "PRIMARY",
          },
        ],
        revision: "1",
      };

      mockGetProcessManagement.mockResolvedValueOnce(mockData);

      const result = await getProcessManagement.callback(
        { app: "123", lang: "ja" },
        mockExtra,
      );

      expect(mockGetProcessManagement).toHaveBeenCalledWith({
        app: "123",
        lang: "ja",
      });
      expect(result.structuredContent).toEqual(mockData);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockData, null, 2),
      });
    });
  });
});
