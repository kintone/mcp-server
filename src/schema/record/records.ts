import { z } from "zod";

const recordValueSchema = z.union([
  z.object({
    type: z.literal("SINGLE_LINE_TEXT"),
    value: z.string().nullable(),
  }),
  z.object({
    type: z.literal("MULTI_LINE_TEXT"),
    value: z.string().nullable(),
  }),
  z.object({
    type: z.literal("RICH_TEXT"),
    value: z.string().nullable(),
  }),
  z.object({
    type: z.literal("NUMBER"),
    value: z.string().nullable(),
  }),
  z.object({
    type: z.literal("DATE"),
    value: z.string().nullable(),
  }),
  z.object({
    type: z.literal("DATETIME"),
    value: z.string().nullable(),
  }),
  z.object({
    type: z.literal("DROP_DOWN"),
    value: z.string().nullable(),
  }),
  z.object({
    type: z.literal("CHECK_BOX"),
    value: z.array(z.string()).nullable(),
  }),
  z.object({
    type: z.literal("MULTI_SELECT"),
    value: z.array(z.string()).nullable(),
  }),
  z.object({
    type: z.literal("RADIO_BUTTON"),
    value: z.string().nullable(),
  }),
  z.object({
    type: z.literal("USER_SELECT"),
    value: z
      .array(
        z.object({
          code: z.string(),
          name: z.string(),
        }),
      )
      .nullable(),
  }),
  z.object({
    type: z.literal("CREATOR"),
    value: z
      .object({
        code: z.string(),
        name: z.string(),
      })
      .nullable(),
  }),
  z.object({
    type: z.literal("CREATED_TIME"),
    value: z.string().nullable(),
  }),
  z.object({
    type: z.literal("MODIFIER"),
    value: z
      .object({
        code: z.string(),
        name: z.string(),
      })
      .nullable(),
  }),
  z.object({
    type: z.literal("UPDATED_TIME"),
    value: z.string().nullable(),
  }),
  z.object({
    type: z.literal("RECORD_NUMBER"),
    value: z.string().nullable(),
  }),
  z.object({
    type: z.literal("__ID__"),
    value: z.string().nullable(),
  }),
  z.object({
    type: z.literal("__REVISION__"),
    value: z.string().nullable(),
  }),
  z.object({
    type: z.literal("CATEGORY"),
    value: z.array(z.string()).nullable(),
  }),
  z.object({
    type: z.literal("STATUS"),
    value: z.string().nullable(),
  }),
  z.object({
    type: z.literal("STATUS_ASSIGNEE"),
    value: z
      .array(
        z.object({
          code: z.string(),
          name: z.string(),
        }),
      )
      .nullable(),
  }),
  z.object({
    type: z.literal("FILE"),
    value: z
      .array(
        z.object({
          contentType: z.string(),
          fileKey: z.string(),
          name: z.string(),
          size: z.string(),
        }),
      )
      .nullable(),
  }),
  z.object({
    type: z.literal("LINK"),
    value: z.string().nullable(),
  }),
  z.object({
    type: z.literal("CALC"),
    value: z.string().nullable(),
  }),
  z.object({
    type: z.literal("LOOKUP"),
    value: z.string().nullable(),
  }),
  z.object({
    type: z.literal("TIME"),
    value: z.string().nullable(),
  }),
  z.object({
    type: z.literal("SUBTABLE"),
    value: z
      .array(
        z.object({
          id: z.string(),
          value: z.record(z.any()),
        }),
      )
      .nullable(),
  }),
  z.object({
    type: z.literal("GROUP"),
    value: z.array(z.any()).nullable(),
  }),
  z.object({
    type: z.literal("REFERENCE_TABLE"),
    value: z.null(),
  }),
  z.object({
    type: z.literal("ORGANIZATION_SELECT"),
    value: z
      .array(
        z.object({
          code: z.string(),
          name: z.string(),
        }),
      )
      .nullable(),
  }),
  z.object({
    type: z.literal("GROUP_SELECT"),
    value: z
      .array(
        z.object({
          code: z.string(),
          name: z.string(),
        }),
      )
      .nullable(),
  }),
  z.object({
    type: z.literal("SPACER"),
    value: z.null(),
  }),
  z.object({
    type: z.literal("HR"),
    value: z.null(),
  }),
  z.object({
    type: z.literal("LABEL"),
    value: z.null(),
  }),
]);

export const recordSchema = z.record(recordValueSchema);
