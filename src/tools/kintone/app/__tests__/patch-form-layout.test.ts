import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import { patchFormLayout } from "../patch-form-layout.js";
import { createMockClient } from "../../../../__tests__/utils.js";

const mockGetFormLayout = vi.fn();
const mockUpdateFormLayout = vi.fn();

const currentLayout = () => [
  {
    type: "ROW",
    fields: [
      {
        type: "LABEL",
        label: "<div>Basic information</div>",
        elementId: "",
        size: { width: "118" },
      },
      { type: "SINGLE_LINE_TEXT", code: "name", size: { width: "372" } },
    ],
  },
  {
    type: "ROW",
    fields: [
      {
        type: "SPACER",
        elementId: "tab",
        size: { width: "744", height: "28" },
      },
    ],
  },
  {
    type: "ROW",
    fields: [
      {
        type: "MULTI_LINE_TEXT",
        code: "memo",
        size: { width: "744", innerHeight: "125" },
      },
      { type: "REFERENCE_TABLE", code: "related" },
    ],
  },
  {
    type: "SUBTABLE",
    code: "items",
    fields: [{ type: "NUMBER", code: "price", size: { width: "120" } }],
  },
  {
    type: "GROUP",
    code: "details",
    layout: [
      {
        type: "ROW",
        fields: [
          {
            type: "LABEL",
            label: "<div>Notes</div>",
            elementId: "",
            size: { width: "200" },
          },
          {
            type: "SPACER",
            elementId: "",
            size: { width: "100", height: "50" },
          },
        ],
      },
    ],
  },
];

const noChange = { label: "", width: "", height: "", innerHeight: "" };

const editAt = (
  position: {
    group?: string;
    row: number;
    column: number;
    type: string;
    code?: string;
  },
  values: Partial<typeof noChange>,
) => ({ group: "", code: "", ...position, ...noChange, ...values });

const callPatch = (args: {
  revision?: string;
  edits: Array<ReturnType<typeof editAt>>;
}) => {
  const client = createMockClient();
  client.app.getFormLayout = mockGetFormLayout;
  client.app.updateFormLayout = mockUpdateFormLayout;
  return patchFormLayout.callback(
    { app: "1", revision: args.revision ?? "-1", edits: args.edits },
    { client },
  );
};

const writtenLayout = () => mockUpdateFormLayout.mock.calls[0][0].layout;

describe("patch-form-layout tool", () => {
  let readLayout: ReturnType<typeof currentLayout>;

  beforeEach(() => {
    vi.clearAllMocks();
    readLayout = currentLayout();
    mockGetFormLayout.mockResolvedValue({ layout: readLayout, revision: "5" });
    mockUpdateFormLayout.mockResolvedValue({ revision: "6" });
  });

  describe("tool configuration", () => {
    it("is named kintone-patch-form-layout", () => {
      expect(patchFormLayout.name).toBe("kintone-patch-form-layout");
    });

    it("points to the preview layout, the full-replace tool, and deployment", () => {
      const { description } = patchFormLayout.config;
      expect(description).toContain(
        "kintone-get-form-layout with preview: true",
      );
      expect(description).toContain("kintone-update-form-layout");
      expect(description).toContain("kintone-deploy-app");
    });

    const inputSchema = z.object(patchFormLayout.config.inputSchema);
    const edit = editAt({ row: 0, column: 0, type: "LABEL" }, { label: "x" });

    it("accepts edits that have every key", () => {
      expect(
        inputSchema.safeParse({ app: "1", revision: "-1", edits: [edit] })
          .success,
      ).toBe(true);
    });

    it.each(Object.keys(edit))("rejects an edit without %s", (key) => {
      const withoutKey = Object.fromEntries(
        Object.entries(edit).filter(([name]) => name !== key),
      );
      expect(
        inputSchema.safeParse({ app: "1", revision: "-1", edits: [withoutKey] })
          .success,
      ).toBe(false);
    });

    it.each([
      { edits: [], description: "no edits" },
      { edits: [{ ...edit, row: -1 }], description: "a negative row" },
      { edits: [{ ...edit, column: 0.5 }], description: "a fractional column" },
      { edits: [{ ...edit, label: null }], description: "a null value" },
    ])("rejects $description", ({ edits }) => {
      expect(
        inputSchema.safeParse({ app: "1", revision: "-1", edits }).success,
      ).toBe(false);
    });

    it("rejects a call without revision", () => {
      expect(inputSchema.safeParse({ app: "1", edits: [edit] }).success).toBe(
        false,
      );
    });
  });

  describe("applying edits", () => {
    it("reads the preview layout and writes it back once with the read revision", async () => {
      const result = await callPatch({
        edits: [
          editAt({ row: 0, column: 0, type: "LABEL" }, { label: "<b>New</b>" }),
        ],
      });

      expect(mockGetFormLayout).toHaveBeenCalledWith({
        app: "1",
        preview: true,
      });
      expect(mockUpdateFormLayout).toHaveBeenCalledTimes(1);
      expect(mockUpdateFormLayout.mock.calls[0][0]).toMatchObject({
        app: "1",
        revision: "5",
      });
      expect(result.structuredContent).toEqual({ revision: "6" });
      expect(result.content).toEqual([
        { type: "text", text: JSON.stringify({ revision: "6" }, null, 2) },
      ]);
    });

    it("changes the text of a LABEL and leaves its other keys", async () => {
      await callPatch({
        edits: [
          editAt({ row: 0, column: 0, type: "LABEL" }, { label: "<b>New</b>" }),
        ],
      });

      expect(writtenLayout()[0].fields[0]).toEqual({
        type: "LABEL",
        label: "<b>New</b>",
        elementId: "",
        size: { width: "118" },
      });
    });

    it("changes the width and height of a SPACER", async () => {
      await callPatch({
        edits: [
          editAt(
            { row: 1, column: 0, type: "SPACER" },
            { width: "300", height: "80" },
          ),
        ],
      });

      expect(writtenLayout()[1].fields[0]).toEqual({
        type: "SPACER",
        elementId: "tab",
        size: { width: "300", height: "80" },
      });
    });

    it("changes the inner height of a MULTI_LINE_TEXT", async () => {
      await callPatch({
        edits: [
          editAt(
            { row: 2, column: 0, type: "MULTI_LINE_TEXT", code: "memo" },
            { innerHeight: "200" },
          ),
        ],
      });

      expect(writtenLayout()[2].fields[0].size).toEqual({
        width: "744",
        innerHeight: "200",
      });
    });

    it("changes an element in the second column of a row", async () => {
      await callPatch({
        edits: [
          editAt(
            { row: 0, column: 1, type: "SINGLE_LINE_TEXT", code: "name" },
            { width: "400" },
          ),
        ],
      });

      expect(writtenLayout()[0].fields[1].size).toEqual({ width: "400" });
    });

    it("changes a field inside a SUBTABLE", async () => {
      await callPatch({
        edits: [
          editAt(
            { row: 3, column: 0, type: "NUMBER", code: "price" },
            { width: "90" },
          ),
        ],
      });

      expect(writtenLayout()[3].fields[0].size).toEqual({ width: "90" });
    });

    it("changes elements inside a GROUP", async () => {
      await callPatch({
        edits: [
          editAt(
            { group: "details", row: 0, column: 0, type: "LABEL" },
            { label: "<div>Remarks</div>" },
          ),
          editAt(
            { group: "details", row: 0, column: 1, type: "SPACER" },
            { height: "10" },
          ),
        ],
      });

      expect(writtenLayout()[4].layout[0].fields).toEqual([
        {
          type: "LABEL",
          label: "<div>Remarks</div>",
          elementId: "",
          size: { width: "200" },
        },
        { type: "SPACER", elementId: "", size: { width: "100", height: "10" } },
      ]);
    });

    it("applies edits to the same element in order", async () => {
      await callPatch({
        edits: [
          editAt({ row: 1, column: 0, type: "SPACER" }, { height: "40" }),
          editAt({ row: 1, column: 0, type: "SPACER" }, { height: "60" }),
        ],
      });

      expect(writtenLayout()[1].fields[0].size.height).toBe("60");
    });

    it("writes back every element it did not edit as read", async () => {
      await callPatch({
        edits: [editAt({ row: 1, column: 0, type: "SPACER" }, { height: "1" })],
      });

      const expected = currentLayout();
      expected[1].fields[0].size = { width: "744", height: "1" };
      expect(writtenLayout()).toEqual(expected);
    });

    it("does not modify the layout it read", async () => {
      await callPatch({
        edits: [editAt({ row: 1, column: 0, type: "SPACER" }, { height: "1" })],
      });

      expect(readLayout).toEqual(currentLayout());
    });

    it('accepts "" for values the element does not have', async () => {
      await callPatch({
        edits: [
          editAt({ row: 0, column: 0, type: "LABEL" }, { label: "<b>New</b>" }),
        ],
      });

      expect(mockUpdateFormLayout).toHaveBeenCalledTimes(1);
    });
  });

  describe("revision", () => {
    it('skips the check for "-1" and still writes back with the read revision', async () => {
      await callPatch({
        revision: "-1",
        edits: [editAt({ row: 1, column: 0, type: "SPACER" }, { height: "1" })],
      });

      expect(mockUpdateFormLayout.mock.calls[0][0].revision).toBe("5");
    });

    it("writes back when the revision matches", async () => {
      await callPatch({
        revision: "5",
        edits: [editAt({ row: 1, column: 0, type: "SPACER" }, { height: "1" })],
      });

      expect(mockUpdateFormLayout).toHaveBeenCalledTimes(1);
    });

    it("stops and asks to read the preview layout again when the revision differs", async () => {
      await expect(
        callPatch({
          revision: "4",
          edits: [
            editAt({ row: 1, column: 0, type: "SPACER" }, { height: "1" }),
          ],
        }),
      ).rejects.toThrow(
        /Revision 4 does not match the current revision 5[\s\S]*kintone-get-form-layout with preview: true/,
      );
      expect(mockUpdateFormLayout).not.toHaveBeenCalled();
    });
  });

  describe("invalid edits", () => {
    it.each([
      {
        description: "a GROUP that does not exist",
        edit: editAt(
          { group: "missing", row: 0, column: 0, type: "LABEL" },
          { label: "x" },
        ),
        message: 'edits[0]: there is no GROUP with code "missing"',
      },
      {
        description: "a row out of range",
        edit: editAt({ row: 5, column: 0, type: "LABEL" }, { label: "x" }),
        message: "edits[0]: row 5 is out of range (the layout has 5 rows)",
      },
      {
        description: "a row out of range inside a GROUP",
        edit: editAt(
          { group: "details", row: 1, column: 0, type: "LABEL" },
          { label: "x" },
        ),
        message: "edits[0]: row 1 is out of range (the layout has 1 rows)",
      },
      {
        description: "a GROUP as the row",
        edit: editAt({ row: 4, column: 0, type: "LABEL" }, { label: "x" }),
        message:
          'edits[0]: row 4 is the GROUP "details"; set group to "details" to edit the elements inside it',
      },
      {
        description: "a column out of range",
        edit: editAt({ row: 1, column: 1, type: "SPACER" }, { height: "1" }),
        message: "edits[0]: column 1 is out of range (row 1 has 1 elements)",
      },
      {
        description: "a type that does not match the element",
        edit: editAt({ row: 0, column: 1, type: "LABEL" }, { label: "x" }),
        message:
          "edits[0]: the element at row 0, column 1 is SINGLE_LINE_TEXT, not LABEL",
      },
      {
        description: "a type that does not match inside a GROUP",
        edit: editAt(
          { group: "details", row: 0, column: 1, type: "LABEL" },
          { label: "x" },
        ),
        message:
          'edits[0]: the element at row 0, column 1 of GROUP "details" is SPACER, not LABEL',
      },
      {
        description: "a code that does not match the field",
        edit: editAt(
          { row: 0, column: 1, type: "SINGLE_LINE_TEXT", code: "company" },
          { width: "400" },
        ),
        message:
          'edits[0]: the element at row 0, column 1 has code "name", not "company"',
      },
      {
        description: "an empty code for a field",
        edit: editAt(
          { row: 0, column: 1, type: "SINGLE_LINE_TEXT" },
          { width: "400" },
        ),
        message:
          'edits[0]: the element at row 0, column 1 has code "name", not ""',
      },
      {
        description: "a code that does not match inside a SUBTABLE",
        edit: editAt(
          { row: 3, column: 0, type: "NUMBER", code: "cost" },
          { width: "90" },
        ),
        message:
          'edits[0]: the element at row 3, column 0 has code "price", not "cost"',
      },
      {
        description: "a code for an element that has none",
        edit: editAt(
          { row: 1, column: 0, type: "SPACER", code: "tab" },
          { height: "1" },
        ),
        message:
          'edits[0]: the element at row 1, column 0 has code "", not "tab"',
      },
      {
        description: "label on an element other than LABEL",
        edit: editAt({ row: 1, column: 0, type: "SPACER" }, { label: "x" }),
        message: "edits[0]: label applies only to LABEL, not SPACER",
      },
      {
        description: "width on a REFERENCE_TABLE",
        edit: editAt(
          { row: 2, column: 1, type: "REFERENCE_TABLE", code: "related" },
          { width: "100" },
        ),
        message: "edits[0]: width does not apply to REFERENCE_TABLE",
      },
      {
        description: "height on an element other than SPACER",
        edit: editAt({ row: 0, column: 0, type: "LABEL" }, { height: "10" }),
        message: "edits[0]: height applies only to SPACER, not LABEL",
      },
      {
        description: "innerHeight on an element other than text areas",
        edit: editAt(
          { row: 1, column: 0, type: "SPACER" },
          { innerHeight: "10" },
        ),
        message:
          "edits[0]: innerHeight applies only to MULTI_LINE_TEXT and RICH_TEXT, not SPACER",
      },
      {
        description: "an edit that changes nothing",
        edit: editAt({ row: 0, column: 0, type: "LABEL" }, {}),
        message:
          "edits[0]: nothing to change; set at least one of label, width, height and innerHeight",
      },
    ])("rejects $description and writes nothing", async ({ edit, message }) => {
      await expect(callPatch({ edits: [edit] })).rejects.toThrow(message);
      expect(mockUpdateFormLayout).not.toHaveBeenCalled();
    });

    it("reports every invalid edit at once and applies none of them", async () => {
      await expect(
        callPatch({
          edits: [
            editAt({ row: 1, column: 0, type: "SPACER" }, { height: "1" }),
            editAt({ row: 9, column: 0, type: "LABEL" }, { label: "x" }),
            editAt(
              { row: 0, column: 0, type: "LABEL" },
              { height: "1", innerHeight: "1" },
            ),
          ],
        }),
      ).rejects.toThrow(
        "Nothing was changed because of the following errors:\n" +
          "edits[1]: row 9 is out of range (the layout has 5 rows)\n" +
          "edits[2]: height applies only to SPACER, not LABEL\n" +
          "edits[2]: innerHeight applies only to MULTI_LINE_TEXT and RICH_TEXT, not LABEL",
      );
      expect(mockUpdateFormLayout).not.toHaveBeenCalled();
    });
  });

  describe("API errors", () => {
    it("passes on a failure to read the layout", async () => {
      mockGetFormLayout.mockRejectedValueOnce(new Error("read failed"));

      await expect(
        callPatch({
          edits: [
            editAt({ row: 1, column: 0, type: "SPACER" }, { height: "1" }),
          ],
        }),
      ).rejects.toThrow("read failed");
      expect(mockUpdateFormLayout).not.toHaveBeenCalled();
    });

    it("passes on a failure to write the layout", async () => {
      mockUpdateFormLayout.mockRejectedValueOnce(new Error("write failed"));

      await expect(
        callPatch({
          edits: [
            editAt({ row: 1, column: 0, type: "SPACER" }, { height: "1" }),
          ],
        }),
      ).rejects.toThrow("write failed");
    });
  });
});
