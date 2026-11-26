import { z } from "zod";
import type { KintoneFormLayout } from "@kintone/rest-api-client";
import { createTool } from "../../factory.js";
import { withoutAdvertisedRequired } from "../../../schema/without-advertised-required.js";
import type { KintoneToolCallback } from "../../types/tool.js";

const layoutEditSchema = z.object({
  group: z
    .string()
    .describe(
      'Field code of the GROUP that contains the row, or "" for a row at the top level of the layout',
    ),
  row: z
    .number()
    .int()
    .min(0)
    .describe(
      "0-based index of the row in the top-level layout, or in the layout of the GROUP given by group",
    ),
  column: z
    .number()
    .int()
    .min(0)
    .describe(
      "0-based index of the element in the fields of the row (or of the SUBTABLE)",
    ),
  type: z
    .string()
    .describe(
      "Type of the element at that position, as returned by kintone-get-form-layout (e.g. LABEL, SPACER, SINGLE_LINE_TEXT). The call fails if it does not match",
    ),
  code: z
    .string()
    .describe(
      'Field code of the element at that position, as returned by kintone-get-form-layout ("" for LABEL, SPACER and HR elements, which have none). The call fails if it does not match',
    ),
  label: z
    .string()
    .describe(
      'New text of a LABEL element, in HTML like the label returned by kintone-get-form-layout, or "" to leave it unchanged (so this tool cannot make a label empty). Only LABEL elements have it',
    ),
  width: z
    .string()
    .describe(
      'New width in pixels (numeric value as string), or "" to leave it unchanged. Every element except REFERENCE_TABLE has it',
    ),
  height: z
    .string()
    .describe(
      'New height in pixels (numeric value as string), or "" to leave it unchanged. Only SPACER elements have it',
    ),
  innerHeight: z
    .string()
    .describe(
      'New inner height in pixels (numeric value as string), or "" to leave it unchanged. Only MULTI_LINE_TEXT and RICH_TEXT elements have it',
    ),
});

type LayoutEdit = z.infer<typeof layoutEditSchema>;

const inputSchema = {
  app: z.string().describe("The ID of the app (numeric value as string)"),
  revision: z
    .string()
    .describe(
      'Revision returned by kintone-get-form-layout with preview: true. If it does not match the current revision of the preview layout, nothing is changed. Specify "-1" to skip the check.',
    ),
  edits: z
    .array(withoutAdvertisedRequired(layoutEditSchema))
    .min(1)
    .describe(
      'Changes to apply, in order. Every edit must have all nine keys: group, row and column point at the element, type and code are what is expected there, and label, width, height and innerHeight are the new values ("" for those to leave unchanged).',
    ),
};

const outputSchema = {
  revision: z.string().describe("Updated app configuration revision number"),
};

const toolName = "kintone-patch-form-layout";
const toolConfig = {
  title: "Patch Form Layout",
  description:
    "Change the text of Label elements and the size of elements in the form layout of a kintone app (preview environment only), without sending the whole layout. " +
    "Read the layout with kintone-get-form-layout with preview: true first, and point at each element by its 0-based position in that result: " +
    'group is the code of the GROUP containing the row or "" for the top level, row is the index of the row in that layout, and column is the index in the fields of the row or SUBTABLE. ' +
    "Does NOT move, add, or remove elements, and does NOT change field labels; use kintone-update-form-layout and kintone-update-form-fields for those. " +
    "If any edit is invalid, nothing is changed. " +
    "Changes require kintone-deploy-app to apply to live app.",
  inputSchema,
  outputSchema,
};

type LayoutElement = KintoneFormLayout.OneOf;
type LayoutField = KintoneFormLayout.Field.OneOf;

const describePosition = ({ group, row, column }: LayoutEdit) =>
  group === ""
    ? `row ${row}, column ${column}`
    : `row ${row}, column ${column} of GROUP "${group}"`;

const rowsOf = (
  layout: LayoutElement[],
  group: string,
): LayoutElement[] | undefined => {
  if (group === "") {
    return layout;
  }
  const groupElement = layout.find(
    (element) => element.type === "GROUP" && element.code === group,
  );
  return groupElement?.type === "GROUP" ? groupElement.layout : undefined;
};

const locateField = (
  layout: LayoutElement[],
  edit: LayoutEdit,
): { field: LayoutField } | { error: string } => {
  const rows = rowsOf(layout, edit.group);
  if (rows === undefined) {
    return { error: `there is no GROUP with code "${edit.group}"` };
  }
  const row = rows.at(edit.row);
  if (row === undefined) {
    return {
      error: `row ${edit.row} is out of range (the layout has ${rows.length} rows)`,
    };
  }
  if (row.type === "GROUP") {
    return {
      error: `row ${edit.row} is the GROUP "${row.code}"; set group to "${row.code}" to edit the elements inside it`,
    };
  }
  const field = row.fields.at(edit.column);
  if (field === undefined) {
    return {
      error: `column ${edit.column} is out of range (row ${edit.row} has ${row.fields.length} elements)`,
    };
  }
  if (field.type !== edit.type) {
    return {
      error: `the element at ${describePosition(edit)} is ${field.type}, not ${edit.type}`,
    };
  }
  const code = "code" in field ? field.code : "";
  if (edit.code !== code) {
    return {
      error: `the element at ${describePosition(edit)} has code "${code}", not "${edit.code}"`,
    };
  }
  return { field };
};

/**
 * Writes the new values of an edit into the field.
 *
 * @param field - Element to change, in the copy of the layout
 * @param edit - Edit whose values are written
 * @returns Errors for the values that do not apply to the type of the field
 */
const applyEdit = (field: LayoutField, edit: LayoutEdit): string[] => {
  const errors: string[] = [];
  if (edit.label !== "") {
    if (field.type === "LABEL") {
      field.label = edit.label;
    } else {
      errors.push(`label applies only to LABEL, not ${field.type}`);
    }
  }
  if (edit.width !== "") {
    if (field.type === "REFERENCE_TABLE") {
      errors.push("width does not apply to REFERENCE_TABLE");
    } else {
      field.size.width = edit.width;
    }
  }
  if (edit.height !== "") {
    if (field.type === "SPACER") {
      field.size.height = edit.height;
    } else {
      errors.push(`height applies only to SPACER, not ${field.type}`);
    }
  }
  if (edit.innerHeight !== "") {
    if (field.type === "MULTI_LINE_TEXT" || field.type === "RICH_TEXT") {
      field.size.innerHeight = edit.innerHeight;
    } else {
      errors.push(
        `innerHeight applies only to MULTI_LINE_TEXT and RICH_TEXT, not ${field.type}`,
      );
    }
  }
  return errors;
};

const hasNoChange = ({ label, width, height, innerHeight }: LayoutEdit) =>
  [label, width, height, innerHeight].every((value) => value === "");

const applyEdits = (layout: LayoutElement[], edits: LayoutEdit[]): string[] =>
  edits.flatMap((edit, index) => {
    if (hasNoChange(edit)) {
      return [
        `edits[${index}]: nothing to change; set at least one of label, width, height and innerHeight`,
      ];
    }
    const located = locateField(layout, edit);
    const errors =
      "error" in located ? [located.error] : applyEdit(located.field, edit);
    return errors.map((error) => `edits[${index}]: ${error}`);
  });

const callback: KintoneToolCallback<typeof inputSchema> = async (
  { app, revision, edits },
  { client },
) => {
  const current = await client.app.getFormLayout({ app, preview: true });
  if (revision !== "-1" && revision !== current.revision) {
    throw new Error(
      `Revision ${revision} does not match the current revision ${current.revision} of the preview layout. ` +
        "Read the layout again with kintone-get-form-layout with preview: true, and point at the elements in that result.",
    );
  }

  const layout = structuredClone(current.layout);
  const errors = applyEdits(layout, edits);
  if (errors.length > 0) {
    throw new Error(
      `Nothing was changed because of the following errors:\n${errors.join("\n")}`,
    );
  }

  const response = await client.app.updateFormLayout({
    app,
    layout,
    revision: current.revision,
  });

  const result = {
    revision: response.revision,
  };

  return {
    structuredContent: result,
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
};

export const patchFormLayout = createTool(toolName, toolConfig, callback);
