import { z } from "zod";

// サブテーブル内フィールド用の基本プロパティ（fieldsプロパティなし）
const subtableFieldProperties = {
  type: z
    .string()
    .describe(
      "Field type (e.g., 'SINGLE_LINE_TEXT', 'NUMBER', 'DROP_DOWN', 'SUBTABLE')",
    ),
  code: z
    .string()
    .describe(
      "Unique field identifier (max 128 chars, cannot start with number, only '_' allowed as special char)",
    ),
  label: z.string().describe("Display name for the field shown to users"),
  noLabel: z
    .boolean()
    .optional()
    .describe("If true, hides the field label in the form"),
  required: z
    .boolean()
    .optional()
    .describe("If true, field value is mandatory for record submission"),
  unique: z
    .boolean()
    .optional()
    .describe("If true, field value must be unique across all records"),
  maxValue: z
    .string()
    .optional()
    .describe("Maximum allowed value for numeric fields"),
  minValue: z
    .string()
    .optional()
    .describe("Minimum allowed value for numeric fields"),
  maxLength: z
    .string()
    .optional()
    .describe("Maximum character length for text fields"),
  minLength: z
    .string()
    .optional()
    .describe("Minimum character length for text fields"),
  defaultValue: z
    .any()
    .optional()
    .describe(
      "Initial value when creating new records (use empty string '' for selection fields)",
    ),
  defaultNowValue: z
    .boolean()
    .optional()
    .describe(
      "If true, uses current date/time as default for DATE/TIME/DATETIME fields",
    ),
  entities: z
    .array(
      z.object({
        type: z.enum(["USER", "GROUP", "ORGANIZATION"]),
        code: z.string(),
      }),
    )
    .optional()
    .describe(
      "Default selected users/groups/departments for USER_SELECT/GROUP_SELECT/ORGANIZATION_SELECT fields",
    ),
  options: z
    .record(
      z.object({
        label: z
          .string()
          .describe("Display label (must exactly match the option key)"),
        index: z
          .string()
          .describe(
            "Index number as string, starting from 0 (e.g., '0', '1', '2')",
          ),
      }),
    )
    .optional()
    .describe(
      "Options for selection fields (DROP_DOWN, RADIO_BUTTON, CHECK_BOX, MULTI_SELECT). IMPORTANT: Option keys must exactly match their corresponding label values. For Japanese environments, use Japanese characters as keys, not English identifiers. Example: {'営業部': {'label': '営業部', 'index': '0'}}",
    ),
  align: z
    .enum(["HORIZONTAL", "VERTICAL"])
    .optional()
    .describe(
      "Layout direction for RADIO_BUTTON/CHECK_BOX options (HORIZONTAL: side by side, VERTICAL: stacked)",
    ),
  expression: z
    .string()
    .optional()
    .describe("Formula for CALC fields (e.g., 'price * quantity')"),
  hideExpression: z
    .boolean()
    .optional()
    .describe(
      "If true, hides the calculation formula from users in CALC fields",
    ),
  format: z
    .string()
    .optional()
    .describe(
      "Display format for NUMBER/CALC fields (e.g., 'NUMBER', 'NUMBER_DIGIT', 'DECIMAL', 'CURRENCY')",
    ),
  displayScale: z
    .string()
    .optional()
    .describe("Number of decimal places to display for NUMBER/CALC fields"),
  unit: z
    .string()
    .optional()
    .describe(
      "Unit text to display with NUMBER fields (e.g., '円', 'USD', 'kg')",
    ),
  unitPosition: z
    .enum(["BEFORE", "AFTER"])
    .optional()
    .describe(
      "Where to display unit text relative to the value (BEFORE: '$100', AFTER: '100円')",
    ),
  digit: z
    .boolean()
    .optional()
    .describe(
      "If true, displays thousands separator in NUMBER/CALC fields (e.g., 1,000)",
    ),
  thumbnailSize: z
    .string()
    .optional()
    .describe(
      "Thumbnail size for FILE field previews (in pixels, e.g., '150')",
    ),
  protocol: z
    .enum(["WEB", "CALL", "MAIL"])
    .optional()
    .describe(
      "Protocol for LINK fields (WEB: http/https links, CALL: tel: links, MAIL: mailto: links)",
    ),
  lookup: z
    .object({
      relatedApp: z.object({
        app: z.string().describe("ID of the related app"),
        code: z.string().describe("Code of the related app"),
      }),
      relatedKeyField: z
        .string()
        .describe("Field code in related app to match against"),
      fieldMappings: z
        .array(
          z.object({
            field: z.string().describe("Field code in current app"),
            relatedField: z
              .string()
              .describe("Field code in related app to copy value from"),
          }),
        )
        .describe("Mapping of fields to copy from related app"),
      lookupPickerFields: z
        .array(z.string())
        .describe("Fields to display in lookup picker"),
      filterCond: z
        .string()
        .optional()
        .describe("Query condition to filter lookup results"),
      sort: z.string().optional().describe("Sort order for lookup results"),
    })
    .optional()
    .describe(
      "Lookup configuration to retrieve values from related app records",
    ),
  referenceTable: z
    .object({
      relatedApp: z.object({
        app: z.string().describe("ID of the related app"),
        code: z.string().describe("Code of the related app"),
      }),
      condition: z.object({
        field: z.string().describe("Field code in current app to match"),
        relatedField: z
          .string()
          .describe("Field code in related app to match against"),
      }),
      filterCond: z
        .string()
        .optional()
        .describe("Additional filter condition for related records"),
      displayFields: z
        .array(z.string())
        .describe("Fields from related app to display in the table"),
      sort: z.string().optional().describe("Sort order for related records"),
      size: z
        .string()
        .optional()
        .describe("Number of records to display per page"),
    })
    .optional()
    .describe(
      "Configuration for REFERENCE_TABLE field to display related app records",
    ),
  openGroup: z
    .boolean()
    .optional()
    .describe(
      "If true, GROUP field is expanded by default when viewing records",
    ),
};

export const baseFieldProperties = {
  type: z
    .string()
    .describe(
      "Field type (e.g., 'SINGLE_LINE_TEXT', 'NUMBER', 'DROP_DOWN', 'SUBTABLE')",
    ),
  code: z
    .string()
    .describe(
      "Unique field identifier (max 128 chars, cannot start with number, only '_' allowed as special char)",
    ),
  label: z.string().describe("Display name for the field shown to users"),
  noLabel: z
    .boolean()
    .optional()
    .describe("If true, hides the field label in the form"),
  required: z
    .boolean()
    .optional()
    .describe("If true, field value is mandatory for record submission"),
  unique: z
    .boolean()
    .optional()
    .describe("If true, field value must be unique across all records"),
  maxValue: z
    .string()
    .optional()
    .describe("Maximum allowed value for numeric fields"),
  minValue: z
    .string()
    .optional()
    .describe("Minimum allowed value for numeric fields"),
  maxLength: z
    .string()
    .optional()
    .describe("Maximum character length for text fields"),
  minLength: z
    .string()
    .optional()
    .describe("Minimum character length for text fields"),
  defaultValue: z
    .any()
    .optional()
    .describe(
      "Initial value when creating new records (use empty string '' for selection fields)",
    ),
  defaultNowValue: z
    .boolean()
    .optional()
    .describe(
      "If true, uses current date/time as default for DATE/TIME/DATETIME fields",
    ),
  entities: z
    .array(
      z.object({
        type: z.enum(["USER", "GROUP", "ORGANIZATION"]),
        code: z.string(),
      }),
    )
    .optional()
    .describe(
      "Default selected users/groups/departments for USER_SELECT/GROUP_SELECT/ORGANIZATION_SELECT fields",
    ),
  options: z
    .record(
      z.object({
        label: z
          .string()
          .describe("Display label (must exactly match the option key)"),
        index: z
          .string()
          .describe(
            "Index number as string, starting from 0 (e.g., '0', '1', '2')",
          ),
      }),
    )
    .optional()
    .describe(
      "Options for selection fields (DROP_DOWN, RADIO_BUTTON, CHECK_BOX, MULTI_SELECT). IMPORTANT: Option keys must exactly match their corresponding label values. For Japanese environments, use Japanese characters as keys, not English identifiers. Example: {'営業部': {'label': '営業部', 'index': '0'}}",
    ),
  align: z
    .enum(["HORIZONTAL", "VERTICAL"])
    .optional()
    .describe(
      "Layout direction for RADIO_BUTTON/CHECK_BOX options (HORIZONTAL: side by side, VERTICAL: stacked)",
    ),
  expression: z
    .string()
    .optional()
    .describe("Formula for CALC fields (e.g., 'price * quantity')"),
  hideExpression: z
    .boolean()
    .optional()
    .describe(
      "If true, hides the calculation formula from users in CALC fields",
    ),
  format: z
    .string()
    .optional()
    .describe(
      "Display format for NUMBER/CALC fields (e.g., 'NUMBER', 'NUMBER_DIGIT', 'DECIMAL', 'CURRENCY')",
    ),
  displayScale: z
    .string()
    .optional()
    .describe("Number of decimal places to display for NUMBER/CALC fields"),
  unit: z
    .string()
    .optional()
    .describe(
      "Unit text to display with NUMBER fields (e.g., '円', 'USD', 'kg')",
    ),
  unitPosition: z
    .enum(["BEFORE", "AFTER"])
    .optional()
    .describe(
      "Where to display unit text relative to the value (BEFORE: '$100', AFTER: '100円')",
    ),
  digit: z
    .boolean()
    .optional()
    .describe(
      "If true, displays thousands separator in NUMBER/CALC fields (e.g., 1,000)",
    ),
  thumbnailSize: z
    .string()
    .optional()
    .describe(
      "Thumbnail size for FILE field previews (in pixels, e.g., '150')",
    ),
  protocol: z
    .enum(["WEB", "CALL", "MAIL"])
    .optional()
    .describe(
      "Protocol for LINK fields (WEB: http/https links, CALL: tel: links, MAIL: mailto: links)",
    ),
  lookup: z
    .object({
      relatedApp: z.object({
        app: z.string().describe("ID of the related app"),
        code: z.string().describe("Code of the related app"),
      }),
      relatedKeyField: z
        .string()
        .describe("Field code in related app to match against"),
      fieldMappings: z
        .array(
          z.object({
            field: z.string().describe("Field code in current app"),
            relatedField: z
              .string()
              .describe("Field code in related app to copy value from"),
          }),
        )
        .describe("Mapping of fields to copy from related app"),
      lookupPickerFields: z
        .array(z.string())
        .describe("Fields to display in lookup picker"),
      filterCond: z
        .string()
        .optional()
        .describe("Query condition to filter lookup results"),
      sort: z.string().optional().describe("Sort order for lookup results"),
    })
    .optional()
    .describe(
      "Lookup configuration to retrieve values from related app records",
    ),
  referenceTable: z
    .object({
      relatedApp: z.object({
        app: z.string().describe("ID of the related app"),
        code: z.string().describe("Code of the related app"),
      }),
      condition: z.object({
        field: z.string().describe("Field code in current app to match"),
        relatedField: z
          .string()
          .describe("Field code in related app to match against"),
      }),
      filterCond: z
        .string()
        .optional()
        .describe("Additional filter condition for related records"),
      displayFields: z
        .array(z.string())
        .describe("Fields from related app to display in the table"),
      sort: z.string().optional().describe("Sort order for related records"),
      size: z
        .string()
        .optional()
        .describe("Number of records to display per page"),
    })
    .optional()
    .describe(
      "Configuration for REFERENCE_TABLE field to display related app records",
    ),
  fields: z
    .record(z.string(), z.object(subtableFieldProperties))
    .optional()
    .describe(
      "Fields in subtable. For SUBTABLE type, define the fields that will be contained within the table. Each key should be the field code, and the value should be the field properties",
    ),
  openGroup: z
    .boolean()
    .optional()
    .describe(
      "If true, GROUP field is expanded by default when viewing records",
    ),
};
