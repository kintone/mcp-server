import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { getSpace } from "../get-space.js";
import { createMockClient } from "../../../../__tests__/utils.js";

const mockGetSpace = vi.fn();

describe("get-space tool", () => {
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
      expect(getSpace.name).toBe("kintone-get-space");
    });

    it("should have correct description", () => {
      expect(getSpace.config.description).toBe(
        "Retrieve a kintone space via the Space REST API (GET /k/v1/space.json). " +
          "Read-only: returns metadata and portal content such as name, default thread, privacy, HTML body, cover image, " +
          "widget visibility, member count, attached apps, and who may create apps (EVERYONE vs ADMIN). " +
          "Requires permission to view the target space. Does not modify any space configuration.",
      );
    });

    it("should have valid input schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getSpace.config.inputSchema!);

      expect(() => schema.parse({ id: "1" })).not.toThrow();
      expect(() => schema.parse({})).toThrow();
      expect(() =>
        schema.parse({
          id: 1,
        }),
      ).toThrow();
    });

    it("should have valid output schema", () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const schema = z.object(getSpace.config.outputSchema!);

      const validOutput = {
        id: "1",
        name: "My Space",
        defaultThread: "2",
        isPrivate: false,
        creator: { code: "user1", name: "User One" },
        modifier: { code: "user2", name: "User Two" },
        memberCount: "3",
        coverType: "PRESET" as const,
        coverKey: "key1",
        coverUrl: "https://example.cybozu.com/space/cover/1",
        body: "<p>Hello</p>",
        useMultiThread: true,
        isGuest: false,
        attachedApps: [
          {
            threadId: "2",
            appId: "10",
            code: "app1",
            name: "App One",
            description: "Desc",
            createdAt: "2024-01-01T00:00:00Z",
            creator: { code: "user1", name: "User One" },
            modifiedAt: "2024-01-02T00:00:00Z",
            modifier: { code: "user1", name: "User One" },
          },
          {
            threadId: null,
            appId: "11",
            code: "app2",
            name: "App Two",
            description: "",
            createdAt: "2024-01-03T00:00:00Z",
            creator: { code: "user3", name: "User Three" },
            modifiedAt: "2024-01-04T00:00:00Z",
            modifier: { code: "user3", name: "User Three" },
          },
        ],
        fixedMember: false,
        showAnnouncement: true,
        showThreadList: false,
        showAppList: true,
        showMemberList: null,
        showRelatedLinkList: null,
        permissions: { createApp: "ADMIN" as const },
      };
      expect(() => schema.parse(validOutput)).not.toThrow();
      expect(() =>
        schema.parse({
          ...validOutput,
          body: null,
        }),
      ).not.toThrow();

      expect(() =>
        schema.parse({
          ...validOutput,
          coverType: "INVALID",
        }),
      ).toThrow();

      expect(() =>
        schema.parse({
          ...validOutput,
          permissions: { createApp: "INVALID" },
        }),
      ).toThrow();

      expect(() => schema.parse({ id: "1" })).toThrow();
    });
  });

  describe("callback function", () => {
    it("should call getSpace and return structured content", async () => {
      const mockSpace = {
        id: "1",
        name: "Test Space",
        defaultThread: "2",
        isPrivate: true,
        creator: { code: "c1", name: "Creator" },
        modifier: { code: "m1", name: "Modifier" },
        memberCount: "5",
        coverType: "BLOB" as const,
        coverKey: "ck",
        coverUrl: "https://example.cybozu.com/x",
        body: "",
        useMultiThread: false,
        isGuest: false,
        attachedApps: [],
        fixedMember: true,
        showAnnouncement: null,
        showThreadList: null,
        showAppList: null,
        showMemberList: null,
        showRelatedLinkList: null,
        permissions: { createApp: "EVERYONE" as const },
      };

      mockGetSpace.mockResolvedValueOnce(mockSpace);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const input = z.object(getSpace.config.inputSchema!).parse({ id: "99" });

      const mockClient = createMockClient();
      mockClient.space.getSpace = mockGetSpace;

      const result = await getSpace.callback(input, {
        client: mockClient,
      });

      expect(mockGetSpace).toHaveBeenCalledWith({ id: "99" });
      expect(result.structuredContent).toEqual(mockSpace);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: "text",
        text: JSON.stringify(mockSpace, null, 2),
      });
    });
  });
});
