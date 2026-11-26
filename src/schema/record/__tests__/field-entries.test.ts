import { describe, it, expect } from "vitest";
import { z } from "zod";
import { fieldEntriesSchema, toRecordForParameter } from "../field-entries.js";

const subtableValue = [
  {
    id: "",
    fields: [
      { fieldCode: "item", value: "Apple" },
      { fieldCode: "tags", value: ["fresh"] },
    ],
  },
  {
    id: "42",
    fields: [{ fieldCode: "item", value: "Banana" }],
  },
];

describe("fieldEntriesSchema", () => {
  it("accepts no entries", () => {
    expect(fieldEntriesSchema.safeParse([]).success).toBe(true);
  });

  it.each([
    { description: "text", value: "Test" },
    { description: "empty text", value: "" },
    { description: "options", value: ["option1", "option2"] },
    { description: "no options", value: [] },
    { description: "entities", value: [{ code: "user1" }, { code: "user2" }] },
    { description: "single entity", value: { code: "user1" } },
    { description: "subtable rows", value: subtableValue },
    {
      description: "subtable row without fields",
      value: [{ id: "", fields: [] }],
    },
  ])("accepts $description", ({ value }) => {
    expect(
      fieldEntriesSchema.safeParse([{ fieldCode: "field", value }]).success,
    ).toBe(true);
  });

  it.each([
    { description: "null value", input: [{ fieldCode: "field", value: null }] },
    { description: "entry without value", input: [{ fieldCode: "field" }] },
    { description: "entry without fieldCode", input: [{ value: "Test" }] },
    {
      description: "files",
      input: [{ fieldCode: "file", value: [{ fileKey: "key" }] }],
    },
    {
      description: "subtable row without id",
      input: [
        {
          fieldCode: "table",
          value: [{ fields: [{ fieldCode: "item", value: "Apple" }] }],
        },
      ],
    },
    {
      description: "subtable nested in a row",
      input: [
        {
          fieldCode: "table",
          value: [
            {
              id: "",
              fields: [{ fieldCode: "inner", value: subtableValue }],
            },
          ],
        },
      ],
    },
  ])("rejects $description", ({ input }) => {
    expect(fieldEntriesSchema.safeParse(input).success).toBe(false);
  });

  it("rejects a field code given twice in a record", () => {
    const result = fieldEntriesSchema.safeParse([
      { fieldCode: "title", value: "A" },
      { fieldCode: "title", value: "B" },
    ]);

    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: [1, "fieldCode"],
        message:
          'Duplicate fieldCode "title". Each field code can appear only once',
      }),
    ]);
  });

  it("rejects a field code given twice in a subtable row", () => {
    const result = fieldEntriesSchema.safeParse([
      {
        fieldCode: "table",
        value: [
          {
            id: "",
            fields: [
              { fieldCode: "item", value: "A" },
              { fieldCode: "item", value: "B" },
            ],
          },
        ],
      },
    ]);

    expect(result.error?.issues.map((issue) => issue.path)).toEqual([
      [0, "value", 0, "fields", 1, "fieldCode"],
    ]);
  });

  // tools/list renders input schemas this way (src/server/tool-definitions.ts).
  const advertised = z.toJSONSchema(z.object({ fields: fieldEntriesSchema }), {
    target: "draft-2020-12",
    io: "input",
    reused: "inline",
  });

  it("does not advertise required keys of entries and subtable rows", () => {
    const fields = advertised.properties?.fields as {
      items: {
        required?: unknown;
        properties: { value: { anyOf: Array<{ items?: object }> } };
      };
    };
    const rows = fields.items.properties.value.anyOf.at(-1)?.items as {
      required?: unknown;
      properties: { fields: { items: { required?: unknown } } };
    };

    expect([
      fields.items.required,
      rows.required,
      rows.properties.fields.items.required,
    ]).toEqual([undefined, undefined, undefined]);
  });
});

describe("toRecordForParameter", () => {
  it("keys values by field code", () => {
    expect(
      toRecordForParameter([
        { fieldCode: "title", value: "Test" },
        { fieldCode: "options", value: ["option1"] },
        { fieldCode: "users", value: [{ code: "user1" }] },
        { fieldCode: "creator", value: { code: "user1" } },
        { fieldCode: "empty", value: [] },
      ]),
    ).toEqual({
      title: { value: "Test" },
      options: { value: ["option1"] },
      users: { value: [{ code: "user1" }] },
      creator: { value: { code: "user1" } },
      empty: { value: [] },
    });
  });

  it("converts no entries to an empty record", () => {
    expect(toRecordForParameter([])).toEqual({});
  });

  it("converts subtable rows and drops empty row IDs", () => {
    expect(
      toRecordForParameter([{ fieldCode: "table", value: subtableValue }]),
    ).toEqual({
      table: {
        value: [
          {
            value: { item: { value: "Apple" }, tags: { value: ["fresh"] } },
          },
          { id: "42", value: { item: { value: "Banana" } } },
        ],
      },
    });
  });
});
