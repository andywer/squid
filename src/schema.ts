import createDebugLogger from "debug"

export enum ColumnType {
  Any = "any",
  Array = "array",
  Boolean = "boolean",
  Date = "date",
  Enum = "enum",
  JSON = "json",
  Number = "number",
  String = "string"
}

interface ColumnDescription<
  Type extends ColumnType,
  SubType extends ColumnDescription<any, any, any>,
  EnumValues extends string | number
> {
  type: Type
  subtype?: SubType
  enum?: EnumValues[]
  hasDefault?: boolean
  nullable?: boolean
}

export interface TableSchemaDescription {
  [columnName: string]: {
    type: ColumnType
    enum?: Array<string | number>
    nullable?: boolean
  }
}

export interface TableSchema<Columns extends TableSchemaDescription> {
  name: string
  columns: Columns
}

type DeriveBuiltinTypeByColumnType<
  Column extends ColumnDescription<any, any, any>
> = Column extends { type: infer Col }
  ? (Col extends ColumnType.Any
      ? any
      : Col extends ColumnType.Boolean
      ? boolean
      : Col extends ColumnType.Date
      ? string
      : Col extends ColumnType.JSON
      ? any
      : Col extends ColumnType.Number
      ? number
      : Col extends ColumnType.String
      ? string
      : Col extends ColumnType.Enum
      ? (Column extends ColumnDescription<ColumnType.Enum, any, infer EnumValues>
          ? EnumValues
          : never)
      : any)
  : never

type DeriveBuiltinType<Column extends ColumnDescription<any, any, any>> = Column extends {
  nullable: true
}
  ? DeriveBuiltinTypeByColumnType<Exclude<Column, "nullable">> | null
  : (Column extends ColumnDescription<ColumnType.Array, infer SubType, any>
      ? Array<DeriveBuiltinTypeByColumnType<SubType>>
      : DeriveBuiltinTypeByColumnType<Column>)

type MandatoryColumnsNames<Columns extends TableSchemaDescription> = {
  [columnName in keyof Columns]: Columns[columnName] extends { hasDefault: true }
    ? never
    : columnName
}[keyof Columns]

type ColumnsWithDefaultsNames<Columns extends TableSchemaDescription> = {
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
  Any: { type: ColumnType.Any }
  Boolean: { type: ColumnType.Boolean }
  Date: { type: ColumnType.Date }
  JSON: { type: ColumnType.JSON }
  Number: { type: ColumnType.Number }
  String: { type: ColumnType.String }
  array<SubType extends ColumnDescription<any, any, any>>(
    subtype: SubType
  ): ColumnDescription<ColumnType.Array, SubType, any>
  default<Column extends ColumnDescription<any, any, any>>(
    column: Column
  ): Column & { hasDefault: true }
  enum<T extends string | number>(values: T[]): ColumnDescription<ColumnType.Enum, any, T>
  nullable<Column extends ColumnDescription<any, any, any>>(
    column: Column
  ): Column & { hasDefault: true; nullable: true }
}

const debugSchema = createDebugLogger("sqldb:schema")

export const Schema: SchemaTypes = {
  Any: { type: ColumnType.Any },
  Boolean: { type: ColumnType.Boolean },
  Date: { type: ColumnType.Date },
  JSON: { type: ColumnType.JSON },
  Number: { type: ColumnType.Number },
  String: { type: ColumnType.String },

  array<SubType extends ColumnDescription<any, any, any>>(subtype: SubType) {
    return { type: ColumnType.Array, subtype }
  },
  default<Column extends ColumnDescription<any, any, any>>(column: Column) {
    return { ...(column as any), hasDefault: true }
  },
  enum<T extends string | number>(values: T[]) {
    return { type: ColumnType.Enum, enum: values }
  },
  nullable<Column extends ColumnDescription<any, any, any>>(column: Column) {
    return { ...(column as any), hasDefault: true, nullable: true }
  }
}

const allTableSchemas: Array<TableSchema<any>> = []

export function defineTable<Columns extends TableSchemaDescription>(
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

export function getAllTableSchemas() {
  return allTableSchemas
}
