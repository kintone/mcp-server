import { describe, expect, it } from "vitest";
import { z } from "zod";
import { layoutForParameterSchema } from "../form-layout.js";
import { updateFormLayout } from "../../../tools/kintone/app/update-form-layout.js";
import { getFormLayout } from "../../../tools/kintone/app/get-form-layout.js";

const fieldTypes = [
  "CALC",
  "CHECK_BOX",
  "CREATED_TIME",
  "CREATOR",
  "DATE",
  "DATETIME",
  "DROP_DOWN",
  "FILE",
  "GROUP_SELECT",
  "HR",
  "LABEL",
  "LINK",
  "MODIFIER",
  "MULTI_LINE_TEXT",
  "MULTI_SELECT",
  "NUMBER",
  "ORGANIZATION_SELECT",
  "RADIO_BUTTON",
  "RECORD_NUMBER",
  "REFERENCE_TABLE",
  "RICH_TEXT",
  "SINGLE_LINE_TEXT",
  "SPACER",
  "TIME",
  "UPDATED_TIME",
  "USER_SELECT",
];

describe("form layout field types", () => {
  it.each(fieldTypes)("accepts the documented %s field type", (type) => {
    const layout = [{ type: "ROW", fields: [{ type, code: "field" }] }];
    expect(layoutForParameterSchema.parse(layout)).toEqual(layout);
  });

  it.each(["GROUP", "SUBTABLE", "STATUS", "STATUS_ASSIGNEE", "CATEGORY"])(
    "rejects %s in row, subtable and group fields",
    (type) => {
      const fields = [{ type, code: "field" }];
      for (const element of [
        { type: "ROW", fields },
        { type: "SUBTABLE", code: "table", fields },
        { type: "GROUP", code: "group", layout: [{ type: "ROW", fields }] },
      ]) {
        expect(layoutForParameterSchema.safeParse([element]).success).toBe(
          false,
        );
      }
    },
  );

  it("preserves groups and subtables at the layout level", () => {
    const layout = [
      {
        type: "SUBTABLE",
        code: "table",
        fields: [{ type: "NUMBER", code: "number" }],
      },
      {
        type: "GROUP",
        code: "group",
        layout: [{ type: "ROW", fields: [{ type: "LABEL", label: "Group" }] }],
      },
    ];
    expect(layoutForParameterSchema.parse(layout)).toEqual(layout);
  });

  it("rejects a group in fields instead of silently stripping its contents", () => {
    const layout = [
      { type: "ROW", fields: [{ type: "GROUP", code: "group", layout: [] }] },
    ];
    expect(layoutForParameterSchema.safeParse(layout).success).toBe(false);
  });

  it.each(["GROUP", "SUBTABLE", "STATUS", "STATUS_ASSIGNEE", "CATEGORY"])(
    "rejects %s in both update input and get output schemas",
    (type) => {
      const layout = [{ type: "ROW", fields: [{ type, code: "field" }] }];
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const inputSchema = z.object(updateFormLayout.config.inputSchema!);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const outputSchema = z.object(getFormLayout.config.outputSchema!);
      expect(inputSchema.safeParse({ app: "1", layout }).success).toBe(false);
      expect(outputSchema.safeParse({ revision: "1", layout }).success).toBe(
        false,
      );
    },
  );
});
