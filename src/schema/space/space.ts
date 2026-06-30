import { z } from "zod";

const userRefSchema = z.object({
  code: z.string().describe("User login name (unique identifier)"),
  name: z.string().describe("Display name of the user"),
});

export const permissionsSchema = z.object({
  createApp: z
    .enum(["EVERYONE", "ADMIN"])
    .describe(
      "Who may create apps in this space: EVERYONE (any member) or ADMIN (space administrators only)",
    ),
});

const attachedAppSchema = z.object({
  threadId: z
    .string()
    .nullable()
    .describe(
      "Thread ID where the app is placed; null when not associated with a thread per API response",
    ),
  appId: z.string().describe("Numeric app ID as string"),
  code: z.string().describe("App code (unique string)"),
  name: z.string().describe("App name"),
  description: z.string().describe("App description"),
  createdAt: z.string().describe("App creation datetime (ISO 8601)"),
  creator: userRefSchema.describe("User who created the app"),
  modifiedAt: z.string().describe("App last modified datetime (ISO 8601)"),
  modifier: userRefSchema.describe("User who last modified the app"),
});

export const spaceSchema = z.object({
  id: z.string().describe("The space ID"),
  name: z.string().describe("The space name"),
  defaultThread: z
    .string()
    .describe("Thread ID of the default thread in this space"),
  isPrivate: z.boolean().describe("Whether the space is private"),
  creator: userRefSchema.describe("User who created the space"),
  modifier: userRefSchema.describe("User who last modified the space"),
  memberCount: z
    .string()
    .describe("Member count returned by the API (stringified number)"),
  coverType: z
    .enum(["BLOB", "PRESET"])
    .describe(
      "Cover image type: BLOB (custom upload) or PRESET (preset image)",
    ),
  coverKey: z.string().describe("Key of the cover image"),
  coverUrl: z.string().describe("URL of the cover image"),
  body: z
    .string()
    .nullable()
    .describe(
      "HTML body of the space portal; null when the portal has no content",
    ),
  useMultiThread: z.boolean().describe("Whether multiple threads are enabled"),
  isGuest: z.boolean().describe("Whether the space is a guest space"),
  attachedApps: z
    .array(attachedAppSchema)
    .describe("Apps attached to this space"),
  fixedMember: z
    .boolean()
    .describe("Whether users are blocked from joining or leaving on their own"),
  showAnnouncement: z
    .boolean()
    .nullable()
    .describe(
      "Announcement widget visibility; null for single-thread spaces where not applicable",
    ),
  showThreadList: z
    .boolean()
    .nullable()
    .describe(
      "Thread list widget visibility; null for single-thread spaces where not applicable",
    ),
  showAppList: z
    .boolean()
    .nullable()
    .describe(
      "App list widget visibility; null for single-thread spaces where not applicable",
    ),
  showMemberList: z
    .boolean()
    .nullable()
    .describe(
      "Member list widget visibility; null for single-thread spaces where not applicable",
    ),
  showRelatedLinkList: z
    .boolean()
    .nullable()
    .describe(
      "Related apps and spaces widget visibility; null for single-thread spaces where not applicable",
    ),
  permissions: permissionsSchema.describe("Space permission settings"),
});
