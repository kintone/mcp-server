import { z } from "zod";

// 共通スキーマ
const optionsSchema = z.record(
  z.string(),
  z.object({
    label: z.string(),
    index: z.string(),
  }),
);

const userEntitySchema = z.object({
  code: z.string(),
  type: z.enum(["USER", "GROUP", "ORGANIZATION"]),
});

// システムフィールド
const recordNumberSchema = z.object({
  type: z.literal("RECORD_NUMBER"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
});

const creatorSchema = z.object({
  type: z.literal("CREATOR"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
});

const createdTimeSchema = z.object({
  type: z.literal("CREATED_TIME"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
});

const modifierSchema = z.object({
  type: z.literal("MODIFIER"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
});

const updatedTimeSchema = z.object({
  type: z.literal("UPDATED_TIME"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
});

const categorySchema = z.object({
  type: z.literal("CATEGORY"),
  code: z.string(),
  label: z.string(),
  enabled: z.boolean().optional(),
});

const statusSchema = z.object({
  type: z.literal("STATUS"),
  code: z.string(),
  label: z.string(),
  enabled: z.boolean().optional(),
});

const statusAssigneeSchema = z.object({
  type: z.literal("STATUS_ASSIGNEE"),
  code: z.string(),
  label: z.string(),
  enabled: z.boolean().optional(),
});

// 基本フィールド
const singleLineTextSchema = z.object({
  type: z.literal("SINGLE_LINE_TEXT"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
  required: z.boolean().optional(),
  defaultValue: z.string().optional(),
  unique: z.boolean().optional(),
  minLength: z.string().optional(),
  maxLength: z.string().optional(),
  expression: z.string().optional(),
  hideExpression: z.boolean().optional(),
});

const numberSchema = z.object({
  type: z.literal("NUMBER"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
  required: z.boolean().optional(),
  defaultValue: z.string().optional(),
  unique: z.boolean().optional(),
  minValue: z.string().optional(),
  maxValue: z.string().optional(),
  digit: z.boolean().optional(),
  displayScale: z.string().optional(),
  unit: z.string().optional(),
  unitPosition: z.enum(["BEFORE", "AFTER"]).optional(),
});

const calcSchema = z.object({
  type: z.literal("CALC"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
  required: z.boolean().optional(),
  expression: z.string().optional(),
  hideExpression: z.boolean().optional(),
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
    .optional(),
  displayScale: z.string().optional(),
  unit: z.string().optional(),
  unitPosition: z.enum(["BEFORE", "AFTER"]).optional(),
});

const multiLineTextSchema = z.object({
  type: z.literal("MULTI_LINE_TEXT"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
  required: z.boolean().optional(),
  defaultValue: z.string().optional(),
});

const richTextSchema = z.object({
  type: z.literal("RICH_TEXT"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
  required: z.boolean().optional(),
  defaultValue: z.string().optional(),
});

const linkSchema = z.object({
  type: z.literal("LINK"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
  required: z.boolean().optional(),
  defaultValue: z.string().optional(),
  unique: z.boolean().optional(),
  minLength: z.string().optional(),
  maxLength: z.string().optional(),
  protocol: z.enum(["WEB", "CALL", "MAIL"]).optional(),
});

// 選択フィールド
const checkboxSchema = z.object({
  type: z.literal("CHECK_BOX"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
  required: z.boolean().optional(),
  defaultValue: z.array(z.string()).optional(),
  options: optionsSchema.optional(),
  align: z.enum(["HORIZONTAL", "VERTICAL"]).optional(),
});

const radioButtonSchema = z.object({
  type: z.literal("RADIO_BUTTON"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
  required: z.boolean().optional(),
  defaultValue: z.string().optional(),
  options: optionsSchema.optional(),
  align: z.enum(["HORIZONTAL", "VERTICAL"]).optional(),
});

const dropdownSchema = z.object({
  type: z.literal("DROP_DOWN"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
  required: z.boolean().optional(),
  defaultValue: z.string().optional(),
  options: optionsSchema.optional(),
});

const multiSelectSchema = z.object({
  type: z.literal("MULTI_SELECT"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
  required: z.boolean().optional(),
  defaultValue: z.array(z.string()).optional(),
  options: optionsSchema.optional(),
});

// ファイル・日付フィールド
const fileSchema = z.object({
  type: z.literal("FILE"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
  required: z.boolean().optional(),
  thumbnailSize: z.enum(["50", "150", "250", "500"]).optional(),
});

const dateSchema = z.object({
  type: z.literal("DATE"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
  required: z.boolean().optional(),
  defaultValue: z.string().optional(),
  unique: z.boolean().optional(),
  defaultNowValue: z.boolean().optional(),
});

const timeSchema = z.object({
  type: z.literal("TIME"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
  required: z.boolean().optional(),
  defaultValue: z.string().optional(),
  defaultNowValue: z.boolean().optional(),
});

const datetimeSchema = z.object({
  type: z.literal("DATETIME"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
  required: z.boolean().optional(),
  defaultValue: z.string().optional(),
  unique: z.boolean().optional(),
  defaultNowValue: z.boolean().optional(),
});

// ユーザー・組織選択フィールド
const userSelectSchema = z.object({
  type: z.literal("USER_SELECT"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
  required: z.boolean().optional(),
  defaultValue: z
    .array(
      z.union([
        userEntitySchema,
        z.object({
          code: z.literal("LOGINUSER()"),
          type: z.literal("FUNCTION"),
        }),
      ]),
    )
    .optional(),
  entities: z.array(userEntitySchema).optional(),
});

const organizationSelectSchema = z.object({
  type: z.literal("ORGANIZATION_SELECT"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
  required: z.boolean().optional(),
  defaultValue: z
    .array(
      z.union([
        z.object({
          code: z.string(),
          type: z.literal("ORGANIZATION"),
        }),
        z.object({
          code: z.literal("PRIMARY_ORGANIZATION()"),
          type: z.literal("FUNCTION"),
        }),
      ]),
    )
    .optional(),
  entities: z
    .array(
      z.object({
        code: z.string(),
        type: z.literal("ORGANIZATION"),
      }),
    )
    .optional(),
});

const groupSelectSchema = z.object({
  type: z.literal("GROUP_SELECT"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
  required: z.boolean().optional(),
  defaultValue: z
    .array(
      z.object({
        code: z.string(),
        type: z.literal("GROUP"),
      }),
    )
    .optional(),
  entities: z
    .array(
      z.object({
        code: z.string(),
        type: z.literal("GROUP"),
      }),
    )
    .optional(),
});

// レイアウトフィールド
const groupSchema = z.object({
  type: z.literal("GROUP"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
  openGroup: z.boolean().optional(),
});

// 関連レコードフィールド
const referenceTableSchema = z.object({
  type: z.literal("REFERENCE_TABLE"),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
  referenceTable: z
    .object({
      relatedApp: z.object({
        app: z.string(),
        code: z.string(),
      }),
      condition: z.object({
        field: z.string(),
        relatedField: z.string(),
      }),
      filterCond: z.string(),
      displayFields: z.array(z.string()),
      sort: z.string(),
      size: z.enum(["5", "10", "20", "30", "40", "50"]),
    })
    .optional(),
});

const lookupSchema = z.object({
  type: z.enum(["NUMBER", "SINGLE_LINE_TEXT"]),
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
  required: z.boolean().optional(),
  lookup: z
    .object({
      relatedApp: z.object({
        app: z.string(),
        code: z.string(),
      }),
      relatedKeyField: z.string(),
      fieldMappings: z.array(
        z.object({
          field: z.string(),
          relatedField: z.string(),
        }),
      ),
      lookupPickerFields: z.array(z.string()),
      filterCond: z.string(),
      sort: z.string(),
    })
    .optional(),
});

// サブテーブルで使用できるフィールド
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
  code: z.string(),
  label: z.string(),
  noLabel: z.boolean().optional(),
  fields: z.record(z.string(), inSubtableFieldSchema).optional(),
});

// 全フィールドタイプのユニオン
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

// PropertiesForParameterのスキーマ
export const propertiesForParameterSchema = z.record(
  z.string(), // fieldCode
  fieldPropertySchema,
);

export type PropertiesForParameter = z.infer<
  typeof propertiesForParameterSchema
>;
