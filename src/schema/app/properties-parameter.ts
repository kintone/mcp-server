import { z } from "zod";

// Common schemas
const optionsSchema = z.record(
  z.string(),
  z.object({
    label: z.string().describe("Display name of the option"),
    index: z.string().describe("Display order of the option"),
  }),
);

const userEntitySchema = z.object({
  code: z.string().describe("Code of user/group/organization"),
  type: z.enum(["USER", "GROUP", "ORGANIZATION"]).describe("Type of entity"),
});

// System fields
const recordNumberSchema = z.object({
  type: z.literal("RECORD_NUMBER"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
});

const creatorSchema = z.object({
  type: z.literal("CREATOR"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
});

const createdTimeSchema = z.object({
  type: z.literal("CREATED_TIME"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
});

const modifierSchema = z.object({
  type: z.literal("MODIFIER"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
});

const updatedTimeSchema = z.object({
  type: z.literal("UPDATED_TIME"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
});

const categorySchema = z.object({
  type: z.literal("CATEGORY"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  enabled: z.boolean().optional().describe("Enable/disable setting"),
});

const statusSchema = z.object({
  type: z.literal("STATUS"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  enabled: z.boolean().optional().describe("Enable/disable setting"),
});

const statusAssigneeSchema = z.object({
  type: z.literal("STATUS_ASSIGNEE"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  enabled: z.boolean().optional().describe("Enable/disable setting"),
});

// Basic fields
const singleLineTextSchema = z.object({
  type: z.literal("SINGLE_LINE_TEXT"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
  required: z
    .boolean()
    .optional()
    .describe(
      "Whether the field is required (true: required, false: optional)",
    ),
  defaultValue: z.string().optional().describe("Default value"),
  unique: z
    .boolean()
    .optional()
    .describe(
      "Whether to prohibit duplicate values (true: prohibit, false: allow)",
    ),
  minLength: z.string().optional().describe("Minimum character length"),
  maxLength: z.string().optional().describe("Maximum character length"),
  expression: z.string().optional().describe("Auto-calculation formula"),
  hideExpression: z
    .boolean()
    .optional()
    .describe("Whether to hide the formula (true: hide, false: show)"),
});

const numberSchema = z.object({
  type: z.literal("NUMBER"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
  required: z
    .boolean()
    .optional()
    .describe(
      "Whether the field is required (true: required, false: optional)",
    ),
  defaultValue: z.string().optional().describe("Default value"),
  unique: z
    .boolean()
    .optional()
    .describe(
      "Whether to prohibit duplicate values (true: prohibit, false: allow)",
    ),
  minValue: z.string().optional().describe("Minimum value"),
  maxValue: z.string().optional().describe("Maximum value"),
  digit: z
    .boolean()
    .optional()
    .describe("Whether to display digit separators (true: show, false: hide)"),
  displayScale: z
    .string()
    .optional()
    .describe("Number of decimal places to display"),
  unit: z.string().optional().describe("Unit symbol"),
  unitPosition: z
    .enum(["BEFORE", "AFTER"])
    .optional()
    .describe("Position of unit (BEFORE: before field, AFTER: after field)"),
});

const calcSchema = z.object({
  type: z.literal("CALC"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
  required: z
    .boolean()
    .optional()
    .describe(
      "Whether the field is required (true: required, false: optional)",
    ),
  expression: z.string().optional().describe("Auto-calculation formula"),
  hideExpression: z
    .boolean()
    .optional()
    .describe("Whether to hide the formula (true: hide, false: show)"),
  format: z
    .enum([
      "NUMBER",
      "NUMBER_DIGIT",
      "DATETIME",
      "DATE",
      "TIME",
      "HOUR_MINUTE",
      "DAY_HOUR_MINUTE",
    ])
    .optional()
    .describe("Display format of calculation result"),
  displayScale: z
    .string()
    .optional()
    .describe("Number of decimal places to display"),
  unit: z.string().optional().describe("Unit symbol"),
  unitPosition: z
    .enum(["BEFORE", "AFTER"])
    .optional()
    .describe("Position of unit (BEFORE: before field, AFTER: after field)"),
});

const multiLineTextSchema = z.object({
  type: z.literal("MULTI_LINE_TEXT"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
  required: z
    .boolean()
    .optional()
    .describe(
      "Whether the field is required (true: required, false: optional)",
    ),
  defaultValue: z.string().optional().describe("Default value"),
});

const richTextSchema = z.object({
  type: z.literal("RICH_TEXT"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
  required: z
    .boolean()
    .optional()
    .describe(
      "Whether the field is required (true: required, false: optional)",
    ),
  defaultValue: z.string().optional().describe("Default value"),
});

const linkSchema = z.object({
  type: z.literal("LINK"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
  required: z
    .boolean()
    .optional()
    .describe(
      "Whether the field is required (true: required, false: optional)",
    ),
  defaultValue: z.string().optional().describe("Default value"),
  unique: z
    .boolean()
    .optional()
    .describe(
      "Whether to prohibit duplicate values (true: prohibit, false: allow)",
    ),
  minLength: z.string().optional().describe("Minimum character length"),
  maxLength: z.string().optional().describe("Maximum character length"),
  protocol: z
    .enum(["WEB", "CALL", "MAIL"])
    .optional()
    .describe("Link protocol (WEB: http/https, CALL: tel, MAIL: mailto)"),
});

// Selection fields
const checkboxSchema = z.object({
  type: z.literal("CHECK_BOX"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
  required: z
    .boolean()
    .optional()
    .describe(
      "Whether the field is required (true: required, false: optional)",
    ),
  defaultValue: z
    .array(z.string())
    .optional()
    .describe("Array of default values"),
  options: optionsSchema.optional().describe("Options configuration"),
  align: z
    .enum(["HORIZONTAL", "VERTICAL"])
    .optional()
    .describe(
      "Alignment of options (HORIZONTAL: horizontal, VERTICAL: vertical)",
    ),
});

const radioButtonSchema = z.object({
  type: z.literal("RADIO_BUTTON"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
  required: z
    .boolean()
    .optional()
    .describe(
      "Whether the field is required (true: required, false: optional)",
    ),
  defaultValue: z.string().optional().describe("Default value"),
  options: optionsSchema.optional().describe("Options configuration"),
  align: z
    .enum(["HORIZONTAL", "VERTICAL"])
    .optional()
    .describe(
      "Alignment of options (HORIZONTAL: horizontal, VERTICAL: vertical)",
    ),
});

const dropdownSchema = z.object({
  type: z.literal("DROP_DOWN"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
  required: z
    .boolean()
    .optional()
    .describe(
      "Whether the field is required (true: required, false: optional)",
    ),
  defaultValue: z.string().optional().describe("Default value"),
  options: optionsSchema.optional().describe("Options configuration"),
});

const multiSelectSchema = z.object({
  type: z.literal("MULTI_SELECT"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
  required: z
    .boolean()
    .optional()
    .describe(
      "Whether the field is required (true: required, false: optional)",
    ),
  defaultValue: z
    .array(z.string())
    .optional()
    .describe("Array of default values"),
  options: optionsSchema.optional().describe("Options configuration"),
});

// File and date fields
const fileSchema = z.object({
  type: z.literal("FILE"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
  required: z
    .boolean()
    .optional()
    .describe(
      "Whether the field is required (true: required, false: optional)",
    ),
  thumbnailSize: z
    .enum(["50", "150", "250", "500"])
    .optional()
    .describe("Thumbnail size (pixels)"),
});

const dateSchema = z.object({
  type: z.literal("DATE"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
  required: z
    .boolean()
    .optional()
    .describe(
      "Whether the field is required (true: required, false: optional)",
    ),
  defaultValue: z
    .string()
    .optional()
    .describe("Default value (YYYY-MM-DD format)"),
  unique: z
    .boolean()
    .optional()
    .describe(
      "Whether to prohibit duplicate values (true: prohibit, false: allow)",
    ),
  defaultNowValue: z
    .boolean()
    .optional()
    .describe(
      "Whether to automatically set the current date (true: auto-set, false: manual)",
    ),
});

const timeSchema = z.object({
  type: z.literal("TIME"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
  required: z
    .boolean()
    .optional()
    .describe(
      "Whether the field is required (true: required, false: optional)",
    ),
  defaultValue: z.string().optional().describe("Default value (HH:MM format)"),
  defaultNowValue: z
    .boolean()
    .optional()
    .describe(
      "Whether to automatically set the current time (true: auto-set, false: manual)",
    ),
});

const datetimeSchema = z.object({
  type: z.literal("DATETIME"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
  required: z
    .boolean()
    .optional()
    .describe(
      "Whether the field is required (true: required, false: optional)",
    ),
  defaultValue: z
    .string()
    .optional()
    .describe("Default value (YYYY-MM-DDTHH:MM:SSZ format)"),
  unique: z
    .boolean()
    .optional()
    .describe(
      "Whether to prohibit duplicate values (true: prohibit, false: allow)",
    ),
  defaultNowValue: z
    .boolean()
    .optional()
    .describe(
      "Whether to automatically set the current datetime (true: auto-set, false: manual)",
    ),
});

// User and organization selection fields
const userSelectSchema = z.object({
  type: z.literal("USER_SELECT"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
  required: z
    .boolean()
    .optional()
    .describe(
      "Whether the field is required (true: required, false: optional)",
    ),
  defaultValue: z
    .array(
      z.union([
        userEntitySchema,
        z.object({
          code: z
            .literal("LOGINUSER()")
            .describe("Function representing the logged-in user"),
          type: z.literal("FUNCTION").describe("Function type"),
        }),
      ]),
    )
    .optional()
    .describe(
      "Array of default users/groups/organizations, or LOGINUSER() function",
    ),
  entities: z
    .array(userEntitySchema)
    .optional()
    .describe("List of selectable users/groups/organizations"),
});

const organizationSelectSchema = z.object({
  type: z.literal("ORGANIZATION_SELECT"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
  required: z
    .boolean()
    .optional()
    .describe(
      "Whether the field is required (true: required, false: optional)",
    ),
  defaultValue: z
    .array(
      z.union([
        z.object({
          code: z.string().describe("Organization code"),
          type: z.literal("ORGANIZATION").describe("Organization type"),
        }),
        z.object({
          code: z
            .literal("PRIMARY_ORGANIZATION()")
            .describe(
              "Function representing the primary organization of the logged-in user",
            ),
          type: z.literal("FUNCTION").describe("Function type"),
        }),
      ]),
    )
    .optional()
    .describe(
      "Array of default organizations, or PRIMARY_ORGANIZATION() function",
    ),
  entities: z
    .array(
      z.object({
        code: z.string().describe("Organization code"),
        type: z.literal("ORGANIZATION").describe("Organization type"),
      }),
    )
    .optional()
    .describe("List of selectable organizations"),
});

const groupSelectSchema = z.object({
  type: z.literal("GROUP_SELECT"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
  required: z
    .boolean()
    .optional()
    .describe(
      "Whether the field is required (true: required, false: optional)",
    ),
  defaultValue: z
    .array(
      z.object({
        code: z.string().describe("Group code"),
        type: z.literal("GROUP").describe("Group type"),
      }),
    )
    .optional()
    .describe("Array of default groups"),
  entities: z
    .array(
      z.object({
        code: z.string().describe("Group code"),
        type: z.literal("GROUP").describe("Group type"),
      }),
    )
    .optional()
    .describe("List of selectable groups"),
});

// Layout fields
const groupSchema = z.object({
  type: z.literal("GROUP"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
  openGroup: z
    .boolean()
    .optional()
    .describe(
      "Whether to display the group in an open state (true: open, false: closed)",
    ),
});

// Related record fields
const referenceTableSchema = z.object({
  type: z.literal("REFERENCE_TABLE"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
  referenceTable: z
    .object({
      relatedApp: z.object({
        app: z.string().describe("App ID of the related app"),
        code: z
          .string()
          .describe("Field code of the related records list field in this app"),
      }),
      condition: z
        .object({
          field: z.string().describe("Field code in this app"),
          relatedField: z.string().describe("Field code in the related app"),
        })
        .describe("Condition for filtering related records"),
      filterCond: z.string().describe("Query for filtering related records"),
      displayFields: z
        .array(z.string())
        .describe("Array of field codes to display"),
      sort: z.string().describe("Sort condition"),
      size: z
        .enum(["1", "3", "5", "10", "20", "30", "40", "50"])
        .describe("Number of records to display"),
    })
    .optional()
    .describe("Related records list configuration"),
});

const lookupSchema = z.object({
  type: z.enum(["NUMBER", "SINGLE_LINE_TEXT"]).describe("Type of lookup field"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
  required: z
    .boolean()
    .optional()
    .describe(
      "Whether the field is required (true: required, false: optional)",
    ),
  lookup: z
    .object({
      relatedApp: z
        .object({
          app: z.string().describe("App ID of the referenced app"),
          code: z.string().describe("Field code in the referenced app"),
        })
        .describe("Referenced app configuration"),
      relatedKeyField: z
        .string()
        .describe("Field code of the key field in the referenced app"),
      fieldMappings: z
        .array(
          z.object({
            field: z.string().describe("Field code in this app"),
            relatedField: z
              .string()
              .describe("Field code in the referenced app"),
          }),
        )
        .describe("Configuration of field copy source and destination"),
      lookupPickerFields: z
        .array(z.string())
        .describe(
          "Array of field codes to display in the lookup picker of the referenced app",
        ),
      filterCond: z
        .string()
        .describe("Query for filtering records in the referenced app"),
      sort: z.string().describe("Sort condition"),
    })
    .optional()
    .describe("Lookup configuration"),
});

// Fields available in subtables
const inSubtableFieldSchema = z.union([
  singleLineTextSchema,
  numberSchema,
  calcSchema,
  multiLineTextSchema,
  richTextSchema,
  linkSchema,
  checkboxSchema,
  radioButtonSchema,
  dropdownSchema,
  multiSelectSchema,
  fileSchema,
  dateSchema,
  timeSchema,
  datetimeSchema,
  userSelectSchema,
  organizationSelectSchema,
  groupSelectSchema,
  lookupSchema,
]);

const subtableSchema = z.object({
  type: z.literal("SUBTABLE"),
  code: z.string().describe("Field code"),
  label: z.string().describe("Field label"),
  noLabel: z
    .boolean()
    .optional()
    .describe("Whether to hide the label (true: hide, false: show)"),
  fields: z
    .record(z.string(), inSubtableFieldSchema)
    .optional()
    .describe("Configuration of fields within the subtable"),
});

// Union of all field types
const fieldPropertySchema = z.union([
  recordNumberSchema,
  creatorSchema,
  createdTimeSchema,
  modifierSchema,
  updatedTimeSchema,
  categorySchema,
  statusSchema,
  statusAssigneeSchema,
  singleLineTextSchema,
  numberSchema,
  calcSchema,
  multiLineTextSchema,
  richTextSchema,
  linkSchema,
  checkboxSchema,
  radioButtonSchema,
  dropdownSchema,
  multiSelectSchema,
  fileSchema,
  dateSchema,
  timeSchema,
  datetimeSchema,
  userSelectSchema,
  organizationSelectSchema,
  groupSelectSchema,
  groupSchema,
  referenceTableSchema,
  lookupSchema,
  subtableSchema,
]);

// Schema for PropertiesForParameter
export const propertiesForParameterSchema = z
  .record(z.string().describe("Field code"), fieldPropertySchema)
  .describe(
    "Object containing field configuration information. Keys are field codes, values are field properties",
  );

export type PropertiesForParameter = z.infer<
  typeof propertiesForParameterSchema
>;
