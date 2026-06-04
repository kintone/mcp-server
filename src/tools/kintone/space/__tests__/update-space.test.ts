import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { updateSpace } from "../update-space.js";
import { createMockClient } from "../../../../__tests__/utils.js";

const mockUpdateSpace = vi.fn();

describe("update-space tool", () => {
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
      expect(updateSpace.name).toBe("kintone-update-space");
    });

    it("should have correct description", () => {
      expect(updateSpace.config.description).toBe(
        "Update settings of a kintone space via the Space REST API (PUT /k/v1/space.json). " +
          "Modifies space configuration such as name, privacy, member lock, multi-thread mode, portal widget visibility, and who may create apps (EVERYONE vs ADMIN). " +
          "Only fields included in the request are updated; omitted fields keep their existing values. " +
          "useMultiThread is applied only when true (single-thread to multi-thread switch); passing false has no effect. " +
          "Requires space administrator privileges on the target space. The API returns an empty body on success.",
      );
    });

    describe("input schema validation with valid inputs", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(updateSpace.config.inputSchema!);

      it.each([
        {
          input: { id: "1" },
          description: "only required id",
        },
        {
          input: { id: "1", name: "Renamed Space" },
          description: "id and name",
        },
        {
          input: {
            id: "1",
            name: "Renamed Space",
            isPrivate: true,
            fixedMember: false,
            useMultiThread: true,
            showAnnouncement: true,
            showThreadList: false,
            showAppList: true,
            showMemberList: false,
            showRelatedLinkList: true,
            permissions: { createApp: "EVERYONE" as const },
          },
          description: "all optional fields",
        },
        {
          input: {
            id: "1",
            permissions: { createApp: "ADMIN" as const },
          },
          description: "ADMIN permissions only",
        },
        {
          input: {
            id: "1",
            name: "x".repeat(100),
          },
          description: "name at exact max length (100 chars)",
        },
      ])("accepts $description", ({ input }) => {
        expect(() => schema.parse(input)).not.toThrow();
      });
    });

    describe("input schema validation with invalid inputs", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(updateSpace.config.inputSchema!);

      it.each([
        { input: {}, description: "missing required id" },
        { input: { id: 1 }, description: "id as number" },
        { input: { id: null }, description: "id as null" },
        {
          input: { id: "1", name: "x".repeat(101) },
          description: "name longer than 100 chars",
        },
        {
          input: { id: "1", isPrivate: "true" },
          description: "isPrivate as string",
        },
        {
          input: { id: "1", useMultiThread: 1 },
          description: "useMultiThread as number",
        },
        {
          input: { id: "1", permissions: { createApp: "INVALID" } },
          description: "permissions.createApp with invalid enum",
        },
        {
          input: { id: "1", permissions: {} },
          description: "permissions object missing createApp",
        },
      ])("rejects $description", ({ input }) => {
        expect(() => schema.parse(input)).toThrow();
      });
    });

    it("should have empty output schema", () => {
      expect(updateSpace.config.outputSchema).toEqual({});
    });
  });

  describe("callback function", () => {
    it("should call updateSpace with only id and return empty content", async () => {
      mockUpdateSpace.mockResolvedValueOnce({});

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const input = z.object(updateSpace.config.inputSchema!).parse({
        id: "42",
      });

      const mockClient = createMockClient();
      mockClient.space.updateSpace = mockUpdateSpace;

      const result = await updateSpace.callback(input, {
        client: mockClient,
      });

      expect(mockUpdateSpace).toHaveBeenCalledWith({
        id: "42",
        name: undefined,
        isPrivate: undefined,
        fixedMember: undefined,
        useMultiThread: undefined,
        showAnnouncement: undefined,
        showThreadList: undefined,
        showAppList: undefined,
        showMemberList: undefined,
        showRelatedLinkList: undefined,
        permissions: undefined,
      });
      expect(result.structuredContent).toEqual({});
      expect(result.content).toEqual([]);
    });

    it("should pass through all provided fields to the API", async () => {
      mockUpdateSpace.mockResolvedValueOnce({});

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const input = z.object(updateSpace.config.inputSchema!).parse({
        id: "100",
        name: "New Name",
        isPrivate: false,
        fixedMember: true,
        useMultiThread: true,
        showAnnouncement: true,
        showThreadList: true,
        showAppList: false,
        showMemberList: false,
        showRelatedLinkList: true,
        permissions: { createApp: "ADMIN" as const },
      });

      const mockClient = createMockClient();
      mockClient.space.updateSpace = mockUpdateSpace;

      const result = await updateSpace.callback(input, {
        client: mockClient,
      });

      expect(mockUpdateSpace).toHaveBeenCalledWith({
        id: "100",
        name: "New Name",
        isPrivate: false,
        fixedMember: true,
        useMultiThread: true,
        showAnnouncement: true,
        showThreadList: true,
        showAppList: false,
        showMemberList: false,
        showRelatedLinkList: true,
        permissions: { createApp: "ADMIN" },
      });
      expect(result.structuredContent).toEqual({});
      expect(result.content).toEqual([]);
    });

    it("should propagate errors from the API", async () => {
      const mockError = new Error("API Error: Space not found");
      mockUpdateSpace.mockRejectedValueOnce(mockError);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const input = z.object(updateSpace.config.inputSchema!).parse({
        id: "999",
        name: "Whatever",
      });

      const mockClient = createMockClient();
      mockClient.space.updateSpace = mockUpdateSpace;

      await expect(
        updateSpace.callback(input, { client: mockClient }),
      ).rejects.toThrow("API Error: Space not found");
    });
  });
});
