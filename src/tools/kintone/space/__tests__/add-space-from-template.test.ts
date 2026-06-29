import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { addSpaceFromTemplate } from "../add-space-from-template.js";
import { createMockClient } from "../../../../__tests__/utils.js";

const mockAddSpaceFromTemplate = vi.fn();

describe("add-space-from-template tool", () => {
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
      expect(addSpaceFromTemplate.name).toBe("kintone-add-space-from-template");
    });

    it("should have correct description", () => {
      expect(addSpaceFromTemplate.config.description).toBe(
        "Create a new kintone space from an existing space template via POST /k/v1/template/space.json. " +
          "Requires permission to create spaces from templates (typically a kintone System Administrator, or a user explicitly granted space-creation rights). " +
          "The members array must contain at least one entry with isAdmin: true; otherwise the API rejects the request. " +
          "To create a guest space, the supplied template id must be a guest space template and isGuest must be true. " +
          "The space is created immediately on the production environment (no deploy step); this operation is not reversible from this tool. " +
          "Returns the id of the newly created space.",
      );
    });

    it("should have valid input schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(addSpaceFromTemplate.config.inputSchema!);

      const parsed = schema.parse({
        id: "100",
        name: "My Space",
        members: [
          {
            entity: { type: "USER", code: "user1" },
            isAdmin: true,
          },
        ],
      });
      expect(parsed.isPrivate).toBe(false);
      expect(parsed.isGuest).toBe(false);
      expect(parsed.fixedMember).toBe(false);
      expect(parsed.members[0].isAdmin).toBe(true);
      expect(parsed.members[0].includeSubs).toBe(false);

      expect(() => schema.parse({})).toThrow();

      expect(() =>
        schema.parse({
          id: "1",
          name: "x",
          members: [],
        }),
      ).toThrow();

      expect(() =>
        schema.parse({
          id: "1",
          name: "x",
          members: [
            {
              entity: { type: "INVALID", code: "x" },
            },
          ],
        }),
      ).toThrow();

      expect(() =>
        schema.parse({
          id: "1",
          name: "",
          members: [{ entity: { type: "USER", code: "u" }, isAdmin: true }],
        }),
      ).toThrow();

      expect(() =>
        schema.parse({
          id: "1",
          members: [{ entity: { type: "USER", code: "u" }, isAdmin: true }],
        }),
      ).toThrow();
    });

    it("should have valid output schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(addSpaceFromTemplate.config.outputSchema!);

      expect(() => schema.parse({ id: "42" })).not.toThrow();
      expect(() => schema.parse({ id: 42 })).toThrow();
      expect(() => schema.parse({})).toThrow();
    });
  });

  describe("callback function", () => {
    it("should call addSpaceFromTemplate with the parsed input and return structured content", async () => {
      mockAddSpaceFromTemplate.mockResolvedValueOnce({ id: "200" });

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const input = z.object(addSpaceFromTemplate.config.inputSchema!).parse({
        id: "100",
        name: "From Template",
        members: [
          {
            entity: { type: "USER", code: "admin1" },
            isAdmin: true,
          },
          {
            entity: { type: "ORGANIZATION", code: "org1" },
            includeSubs: true,
          },
        ],
        isPrivate: true,
        fixedMember: true,
      });

      const mockClient = createMockClient();
      mockClient.space.addSpaceFromTemplate = mockAddSpaceFromTemplate;

      const result = await addSpaceFromTemplate.callback(input, {
        client: mockClient,
      });

      expect(mockAddSpaceFromTemplate).toHaveBeenCalledWith({
        id: "100",
        name: "From Template",
        members: [
          {
            entity: { type: "USER", code: "admin1" },
            isAdmin: true,
            includeSubs: false,
          },
          {
            entity: { type: "ORGANIZATION", code: "org1" },
            isAdmin: false,
            includeSubs: true,
          },
        ],
        isPrivate: true,
        isGuest: false,
        fixedMember: true,
      });
      expect(result.structuredContent).toEqual({ id: "200" });
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify({ id: "200" }, null, 2),
      });
    });
  });
});
