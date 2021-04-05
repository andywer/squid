import createDebugLogger from "debug"

export enum ColumnType {
  Any = "any",
  Array = "array",
  Boolean = "boolean",
  Date = "date",
  Enum = "enum",
  JSON = "json",
  Number = "number",
  Object = "object",
  String = "string",
  UUID = "uuid"
}

interface ObjectShape {
  [propName: string]: ColumnDescription<any, any, any, any>
}

export interface ColumnDescription<
  Type extends ColumnType,
  SubType extends ColumnDescription<any, any, any, any>,
  EnumValues extends string | number,
  ObjectProps extends ObjectShape
> {
  type: Type
  subtype?: SubType
  enum?: EnumValues[]
  props?: ObjectProps
  hasDefault?: boolean
  nullable?: boolean
}

export type ColumnDescriptor = ColumnDescription<any, any, any, any>

export interface TableSchemaDescriptor {
  [columnName: string]: ColumnDescriptor
}

export interface TableSchema<Columns extends TableSchemaDescriptor> {
  name: string
  columns: Columns
}

type DeriveBuiltinTypeByColumnType<
  Column extends ColumnDescription<any, any, any, any>
> = Column extends { type: infer Col }
  ? (Col extends ColumnType.Any
      ? any
      : Col extends ColumnType.Boolean
      ? boolean
      : Col extends ColumnType.Date
      ? string
      : Col extends ColumnType.Number
      ? number
      : Col extends ColumnType.String
      ? string
      : Col extends ColumnType.Enum
      ? (Column extends ColumnDescription<ColumnType.Enum, any, infer EnumValues, any>
          ? EnumValues
          : never)
      : any)
  : never

type DeriveComplexBuiltinType<
  Column extends ColumnDescription<any, any, any, any>
> = Column extends ColumnDescription<ColumnType.Array, infer ItemType, any, any>
  ? Array<DeriveBuiltinTypeByColumnType<ItemType>>
  : Column extends ColumnDescription<ColumnType.JSON, infer JSONType, any, any>
  ? DeriveBuiltinTypeByColumnType<JSONType>
  : Column extends ColumnDescription<ColumnType.Object, any, any, infer ObjectProps>
  ? { [propName in keyof ObjectProps]: DeriveBuiltinType<ObjectProps[propName]> }
  : DeriveBuiltinTypeByColumnType<Column>

type DeriveBuiltinType<Column extends ColumnDescription<any, any, any, any>> = Column extends {
  nullable: true
}
  ? DeriveComplexBuiltinType<Column> | null
  : DeriveComplexBuiltinType<Column>

type MandatoryColumnsNames<Columns extends TableSchemaDescriptor> = {
  [columnName in keyof Columns]: Columns[columnName] extends { hasDefault: true }
    ? never
    : columnName
}[keyof Columns]

type ColumnsWithDefaultsNames<Columns extends TableSchemaDescriptor> = {
  [columnName in keyof Columns]: Columns[columnName] extends { hasDefault: true }
    ? columnName
    : never
}[keyof Columns]

export type TableRow<
  ConcreteTableSchema extends TableSchema<any>
> = ConcreteTableSchema extends TableSchema<infer Columns>
  ? { [columnName in keyof Columns]: DeriveBuiltinType<Columns[columnName]> }
  : never

export type NewTableRow<
  ConcreteTableSchema extends TableSchema<any>
> = ConcreteTableSchema extends TableSchema<infer Columns>
  ? { [columnName in MandatoryColumnsNames<Columns>]: DeriveBuiltinType<Columns[columnName]> } &
      { [columnName in ColumnsWithDefaultsNames<Columns>]?: DeriveBuiltinType<Columns[columnName]> }
  : never

interface SchemaTypes {
  /** Placeholder. Can stand for any random data type. Avoid using it. */
  Any: { type: ColumnType.Any }

  /** Data type for BOOLEAN columns. */
  Boolean: { type: ColumnType.Boolean }

  /** Data type for DATE, DATETIME, TIMESTAMP columns. */
  Date: { type: ColumnType.Date }

  /** Data type for INTEGER, SMALLINT, BIGINT, FLOAT, REAL, NUMERIC columns. */
  Number: { type: ColumnType.Number }

  /** Data type for CHAR, VARCHAR, TEXT columns. */
  String: { type: ColumnType.String }

  /** Data type for Uuid */
  UUID: { type: ColumnType.UUID }

  /** Data type for array columns. Pass the data type of the array elements. */
  Array<SubType extends ColumnDescription<any, any, any, any>>(
    subtype: SubType
  ): ColumnDescription<ColumnType.Array, SubType, any, any>

  /** Data type for ENUM columns. Pass an array of possible values. */
  Enum<T extends string | number>(values: T[]): ColumnDescription<ColumnType.Enum, any, T, any>

  /**
   * Data type for JSON, JSONB columns. Pass Schema.Object(), Schema.Array(), ..., Schema.Any
   * to declare the content of the JSON(B) column.
   */
  JSON<SubType extends ColumnDescription<any, any, any, any>>(
    subtype: SubType
  ): ColumnDescription<ColumnType.JSON, SubType, any, any>

  /** Pseudo data type to describe the shape of objects stored in a Schema.JSON() column. */
  Object<Props extends ObjectShape>(
    props: Props
  ): ColumnDescription<ColumnType.Object, any, any, Props>

  /** Declare that this column has a DEFAULT value. Pass the actual schema definition. */
  default<Column extends ColumnDescription<any, any, any, any>>(
    column: Column
  ): Column & { hasDefault: true }

  /** Declare that this column allows NULL values. Implies DEFAULT NULL. */
  nullable<Column extends ColumnDescription<any, any, any, any>>(
    column: Column
  ): Column & { hasDefault: true; nullable: true }
}

const debugSchema = createDebugLogger("squid:schema")

/**
 * Schema types to declare the data type of table columns.
 */
export const Schema: SchemaTypes = {
  Any: { type: ColumnType.Any },
  Boolean: { type: ColumnType.Boolean },
  Date: { type: ColumnType.Date },
  Number: { type: ColumnType.Number },
  String: { type: ColumnType.String },
  UUID: { type: ColumnType.UUID },

  Array<SubType extends ColumnDescription<any, any, any, any>>(elementType: SubType) {
    return { type: ColumnType.Array, subtype: elementType }
  },
  Enum<T extends string | number>(values: T[]) {
    return { type: ColumnType.Enum, enum: values }
  },
  JSON<SubType extends ColumnDescription<any, any, any, any>>(subtype: SubType) {
    return { type: ColumnType.JSON, subtype }
  },
  Object<Props extends ObjectShape>(props: Props) {
    return { type: ColumnType.Object, props }
  },

  default<Column extends ColumnDescription<any, any, any, any>>(column: Column) {
    return { ...(column as any), hasDefault: true }
  },

  nullable<Column extends ColumnDescription<any, any, any, any>>(column: Column) {
    return { ...(column as any), hasDefault: true, nullable: true }
  }
}

const allTableSchemas: Array<TableSchema<any>> = []

/**
 * Declare a table's schema. Registers the schema globally.
 */
export function defineTable<Columns extends TableSchemaDescriptor>(
  tableName: string,
  schema: Columns
): TableSchema<Columns> {
  debugSchema(`Defining schema for table ${tableName}:`, schema)
  const table: TableSchema<Columns> = {
    name: tableName,
    columns: schema
  }
  allTableSchemas.push(table)
  return table
}

/**
 * Return an array of all defined table schemas.
 */
export function getAllTableSchemas() {
  return allTableSchemas
}
