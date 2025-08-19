import { z } from "zod";

// Common properties for all fields
const baseFieldSchema = z.object({
  code: z.string().describe("The field code"),
  label: z.string().describe("The field name"),
  noLabel: z.boolean().optional().describe("Whether to hide the field name"),
  required: z.boolean().optional().describe("Whether the field is required"),
  enabled: z
    .boolean()
    .optional()
    .describe("Whether the field is enabled (for STATUS and CATEGORY fields)"),
});

// Option structure for selection fields
const optionSchema = z.object({
  label: z.string().describe("Display text for the option"),
  index: z.string().describe("Sort order (0, 1, 2, ...)"),
});

// Entity structure for user/group selection fields
const entitySchema = z.object({
  type: z.enum(["USER", "GROUP", "ORGANIZATION"]).describe("Entity type"),
  code: z.string().describe("Entity code identifier"),
});

// Lookup configuration
const lookupSchema = z.object({
  relatedApp: z
    .object({
      app: z.string().describe("ID of the related app"),
      code: z
        .string()
        .describe("Field code in the related app (usually empty)"),
    })
    .describe("Target app for lookup"),
  relatedKeyField: z
    .string()
    .describe("Field code in the related app to match against"),
  fieldMappings: z
    .array(
      z
        .object({
          field: z.string().describe("Field code in current app to populate"),
          relatedField: z
            .string()
            .describe("Field code in related app to copy from"),
        })
        .describe("Field mapping configuration"),
    )
    .describe("List of fields to copy from related app"),
  lookupPickerFields: z
    .array(z.string())
    .describe("Fields to display in the lookup picker"),
  filterCond: z
    .string()
    .optional()
    .describe("Filter condition for lookup records"),
  sort: z.string().optional().describe("Sort order for lookup records"),
});

// Reference table configuration
const referenceTableSchema = z.object({
  relatedApp: z
    .object({
      app: z.string().describe("ID of the related app"),
      code: z
        .string()
        .describe("Field code in the related app (usually empty)"),
    })
    .describe("Target app for reference table"),
  condition: z
    .object({
      field: z.string().describe("Field code in current app for linking"),
      relatedField: z
        .string()
        .describe("Field code in related app for linking"),
    })
    .describe("Link condition between apps"),
  filterCond: z
    .string()
    .optional()
    .describe("Filter condition for displayed records"),
  displayFields: z
    .array(z.string())
    .describe("Fields from related app to display in table"),
  sort: z.string().optional().describe("Sort order for displayed records"),
  size: z.string().optional().describe("Maximum number of records to display"),
});

// Forward declaration for recursive subtable fields
export const fieldPropertySchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    // Text fields
    baseFieldSchema.extend({
      type: z.literal("SINGLE_LINE_TEXT").describe("Single line text field"),
      defaultValue: z.string().optional().describe("Default text value"),
      unique: z
        .boolean()
        .optional()
        .describe("Enforce unique values across records"),
      minLength: z
        .string()
        .optional()
        .describe("Minimum character length (empty string = no limit)"),
      maxLength: z
        .string()
        .optional()
        .describe("Maximum character length (empty string = no limit)"),
      expression: z
        .string()
        .optional()
        .describe("Auto-calculation formula (for display only)"),
      hideExpression: z
        .boolean()
        .optional()
        .describe("Hide the calculation formula from users"),
    }),

    baseFieldSchema.extend({
      type: z.literal("MULTI_LINE_TEXT").describe("Multi-line text field"),
      defaultValue: z.string().optional().describe("Default text value"),
    }),

    baseFieldSchema.extend({
      type: z.literal("RICH_TEXT").describe("Rich text editor field"),
      defaultValue: z.string().optional().describe("Default HTML content"),
    }),

    // Number fields
    baseFieldSchema.extend({
      type: z.literal("NUMBER").describe("Numeric input field"),
      defaultValue: z
        .string()
        .optional()
        .describe("Default numeric value as string"),
      unique: z
        .boolean()
        .optional()
        .describe("Enforce unique values across records"),
      minValue: z
        .string()
        .optional()
        .describe("Minimum allowed value (empty string = no limit)"),
      maxValue: z
        .string()
        .optional()
        .describe("Maximum allowed value (empty string = no limit)"),
      digit: z
        .boolean()
        .optional()
        .describe("Display thousands separator (e.g., 1,000)"),
      displayScale: z
        .string()
        .optional()
        .describe("Number of decimal places to display"),
      unit: z.string().optional().describe("Unit symbol (e.g., '$', 'kg')"),
      unitPosition: z
        .enum(["BEFORE", "AFTER"])
        .optional()
        .describe("Position of unit symbol"),
    }),

    baseFieldSchema.extend({
      type: z.literal("CALC").describe("Calculated field (read-only)"),
      expression: z.string().describe("Calculation formula (required)"),
      format: z
        .string()
        .optional()
        .describe(
          "Display format (NUMBER, DATETIME, DATE, TIME, HOUR_MINUTE, DAY_HOUR_MINUTE)",
        ),
      displayScale: z
        .string()
        .optional()
        .describe("Number of decimal places for numeric results"),
      hideExpression: z
        .boolean()
        .optional()
        .describe("Hide calculation formula from users"),
      unit: z.string().optional().describe("Unit symbol for numeric results"),
      unitPosition: z
        .enum(["BEFORE", "AFTER"])
        .optional()
        .describe("Position of unit symbol"),
    }),

    // Selection fields
    baseFieldSchema.extend({
      type: z
        .literal("RADIO_BUTTON")
        .describe("Radio button selection (single choice)"),
      options: z
        .record(optionSchema)
        .describe("Available options - key should match defaultValue"),
      defaultValue: z
        .string()
        .optional()
        .describe("Default selected option key (not label)"),
      align: z
        .enum(["HORIZONTAL", "VERTICAL"])
        .optional()
        .describe("Layout orientation"),
    }),

    baseFieldSchema.extend({
      type: z
        .literal("CHECK_BOX")
        .describe("Checkbox selection (multiple choice)"),
      options: z
        .record(optionSchema)
        .describe("Available options - keys should match defaultValue items"),
      defaultValue: z
        .array(z.string())
        .optional()
        .describe("Default selected option keys (not labels)"),
      align: z
        .enum(["HORIZONTAL", "VERTICAL"])
        .optional()
        .describe("Layout orientation"),
    }),

    baseFieldSchema.extend({
      type: z
        .literal("MULTI_SELECT")
        .describe("Multi-select dropdown (multiple choice)"),
      options: z
        .record(optionSchema)
        .describe("Available options - keys should match defaultValue items"),
      defaultValue: z
        .array(z.string())
        .optional()
        .describe("Default selected option keys (not labels)"),
    }),

    baseFieldSchema.extend({
      type: z
        .literal("DROP_DOWN")
        .describe("Dropdown selection (single choice)"),
      options: z
        .record(optionSchema)
        .describe("Available options - key should match defaultValue"),
      defaultValue: z
        .string()
        .optional()
        .describe(
          "Default selected option key (not label) or empty string for none",
        ),
    }),

    // Date/Time fields
    baseFieldSchema.extend({
      type: z.literal("DATE").describe("Date picker field"),
      defaultValue: z
        .string()
        .optional()
        .describe("Default date (YYYY-MM-DD format) or empty string"),
      defaultNowValue: z
        .boolean()
        .optional()
        .describe("Auto-populate with current date"),
      unique: z
        .boolean()
        .optional()
        .describe("Enforce unique dates across records"),
    }),

    baseFieldSchema.extend({
      type: z.literal("TIME").describe("Time picker field"),
      defaultValue: z
        .string()
        .optional()
        .describe("Default time (HH:mm format) or empty string"),
      defaultNowValue: z
        .boolean()
        .optional()
        .describe("Auto-populate with current time"),
    }),

    baseFieldSchema.extend({
      type: z.literal("DATETIME").describe("Date and time picker field"),
      defaultValue: z
        .string()
        .optional()
        .describe("Default datetime (ISO 8601 format) or empty string"),
      defaultNowValue: z
        .boolean()
        .optional()
        .describe("Auto-populate with current date and time"),
      unique: z
        .boolean()
        .optional()
        .describe("Enforce unique datetimes across records"),
    }),

    // File field
    baseFieldSchema.extend({
      type: z.literal("FILE").describe("File attachment field"),
      thumbnailSize: z
        .string()
        .optional()
        .describe("Thumbnail size in pixels (e.g., '150')"),
    }),

    // Link field
    baseFieldSchema.extend({
      type: z.literal("LINK").describe("Hyperlink field"),
      defaultValue: z
        .string()
        .optional()
        .describe("Default URL or empty string"),
      protocol: z
        .enum(["WEB", "CALL", "MAIL"])
        .optional()
        .describe("Link protocol type"),
      minLength: z
        .string()
        .optional()
        .describe("Minimum URL length (empty string = no limit)"),
      maxLength: z
        .string()
        .optional()
        .describe("Maximum URL length (empty string = no limit)"),
      unique: z
        .boolean()
        .optional()
        .describe("Enforce unique URLs across records"),
    }),

    // User selection fields
    baseFieldSchema.extend({
      type: z.literal("USER_SELECT").describe("User selection field"),
      entities: z
        .array(entitySchema)
        .optional()
        .describe("Pre-selected users/organizations/groups"),
      defaultValue: z
        .array(z.any())
        .optional()
        .describe("Default selected user entities"),
    }),

    baseFieldSchema.extend({
      type: z
        .literal("ORGANIZATION_SELECT")
        .describe("Organization selection field"),
      entities: z
        .array(entitySchema)
        .optional()
        .describe("Pre-selected organizations"),
      defaultValue: z
        .array(z.any())
        .optional()
        .describe("Default selected organization entities"),
    }),

    baseFieldSchema.extend({
      type: z.literal("GROUP_SELECT").describe("Group selection field"),
      entities: z
        .array(entitySchema)
        .optional()
        .describe("Pre-selected groups"),
      defaultValue: z
        .array(z.any())
        .optional()
        .describe("Default selected group entities"),
    }),

    // Advanced fields
    baseFieldSchema.extend({
      type: z
        .literal("REFERENCE_TABLE")
        .describe("Related records table (displays records from another app)"),
      referenceTable: referenceTableSchema.describe(
        "Configuration for linking to another app's records",
      ),
    }),

    baseFieldSchema.extend({
      type: z
        .literal("LOOKUP")
        .describe("Lookup field (auto-populates from another app)"),
      lookup: lookupSchema.describe(
        "Configuration for looking up data from another app",
      ),
      // Lookup fields inherit properties from their base field type
      defaultValue: z
        .any()
        .optional()
        .describe("Default value based on the lookup field type"),
      unique: z
        .boolean()
        .optional()
        .describe("Enforce unique values across records"),
      minValue: z
        .string()
        .optional()
        .describe("Minimum value (for numeric lookups)"),
      maxValue: z
        .string()
        .optional()
        .describe("Maximum value (for numeric lookups)"),
      digit: z
        .boolean()
        .optional()
        .describe("Display thousands separator (for numeric lookups)"),
      displayScale: z
        .string()
        .optional()
        .describe("Decimal places (for numeric lookups)"),
      unit: z.string().optional().describe("Unit symbol (for numeric lookups)"),
      unitPosition: z
        .enum(["BEFORE", "AFTER"])
        .optional()
        .describe("Unit position (for numeric lookups)"),
      minLength: z
        .string()
        .optional()
        .describe("Minimum length (for text lookups)"),
      maxLength: z
        .string()
        .optional()
        .describe("Maximum length (for text lookups)"),
      expression: z
        .string()
        .optional()
        .describe("Calculation formula (for calculated lookups)"),
      hideExpression: z
        .boolean()
        .optional()
        .describe("Hide formula (for calculated lookups)"),
      defaultNowValue: z
        .boolean()
        .optional()
        .describe("Auto-populate current time (for date/time lookups)"),
      thumbnailSize: z
        .string()
        .optional()
        .describe("Thumbnail size (for file lookups)"),
      protocol: z
        .enum(["WEB", "CALL", "MAIL"])
        .optional()
        .describe("Protocol type (for link lookups)"),
      entities: z
        .array(entitySchema)
        .optional()
        .describe("Pre-selected entities (for user selection lookups)"),
      options: z
        .record(optionSchema)
        .optional()
        .describe("Selection options (for selection lookups)"),
      align: z
        .enum(["HORIZONTAL", "VERTICAL"])
        .optional()
        .describe("Layout orientation (for selection lookups)"),
    }),

    // Layout fields
    baseFieldSchema.extend({
      type: z
        .literal("GROUP")
        .describe("Group field (organizes other fields visually)"),
      openGroup: z
        .boolean()
        .optional()
        .describe("Whether group is expanded by default"),
    }),

    baseFieldSchema.extend({
      type: z
        .literal("SUBTABLE")
        .describe("Subtable field (contains multiple rows of sub-fields)"),
      fields: z
        .record(fieldPropertySchema)
        .optional()
        .describe("Fields within the subtable"),
    }),

    // Special fields
    baseFieldSchema.extend({
      type: z
        .literal("SPACER")
        .describe("Spacer element (adds vertical space)"),
      size: z.string().optional().describe("Height of the spacer in pixels"),
    }),

    baseFieldSchema.extend({
      type: z.literal("HR").describe("Horizontal rule (divider line)"),
      size: z.string().optional().describe("Thickness of the line"),
    }),

    baseFieldSchema.extend({
      type: z.literal("LABEL").describe("Label element (displays text)"),
      size: z.string().optional().describe("Font size or display size"),
    }),
  ]),
);
