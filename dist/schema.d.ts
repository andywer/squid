export declare enum ColumnType {
    Any = "any",
    Array = "array",
    Boolean = "boolean",
    Date = "date",
    Enum = "enum",
    JSON = "json",
    Number = "number",
    Object = "object",
    String = "string"
}
interface ObjectShape {
    [propName: string]: ColumnDescription<any, any, any, any>;
}
interface ColumnDescription<Type extends ColumnType, SubType extends ColumnDescription<any, any, any, any>, EnumValues extends string | number, ObjectProps extends ObjectShape> {
    type: Type;
    subtype?: SubType;
    enum?: EnumValues[];
    props?: ObjectProps;
    hasDefault?: boolean;
    nullable?: boolean;
}
export interface TableSchemaDescription {
    [columnName: string]: {
        type: ColumnType;
        enum?: Array<string | number>;
        nullable?: boolean;
    };
}
export interface TableSchema<Columns extends TableSchemaDescription> {
    name: string;
    columns: Columns;
}
declare type DeriveBuiltinTypeByColumnType<Column extends ColumnDescription<any, any, any, any>> = Column extends {
    type: infer Col;
} ? (Col extends ColumnType.Any ? any : Col extends ColumnType.Boolean ? boolean : Col extends ColumnType.Date ? string : Col extends ColumnType.Number ? number : Col extends ColumnType.String ? string : Col extends ColumnType.Enum ? (Column extends ColumnDescription<ColumnType.Enum, any, infer EnumValues, any> ? EnumValues : never) : any) : never;
declare type DeriveComplexBuiltinType<Column extends ColumnDescription<any, any, any, any>> = Column extends ColumnDescription<ColumnType.Array, infer ItemType, any, any> ? Array<DeriveBuiltinTypeByColumnType<ItemType>> : Column extends ColumnDescription<ColumnType.JSON, infer JSONType, any, any> ? DeriveBuiltinTypeByColumnType<JSONType> : Column extends ColumnDescription<ColumnType.Object, any, any, infer ObjectProps> ? {
    [propName in keyof ObjectProps]: DeriveBuiltinType<ObjectProps[propName]>;
} : DeriveBuiltinTypeByColumnType<Column>;
declare type DeriveBuiltinType<Column extends ColumnDescription<any, any, any, any>> = Column extends {
    nullable: true;
} ? DeriveComplexBuiltinType<Column> | null : DeriveComplexBuiltinType<Column>;
declare type MandatoryColumnsNames<Columns extends TableSchemaDescription> = {
    [columnName in keyof Columns]: Columns[columnName] extends {
        hasDefault: true;
    } ? never : columnName;
}[keyof Columns];
declare type ColumnsWithDefaultsNames<Columns extends TableSchemaDescription> = {
    [columnName in keyof Columns]: Columns[columnName] extends {
        hasDefault: true;
    } ? columnName : never;
}[keyof Columns];
export declare type TableRow<ConcreteTableSchema extends TableSchema<any>> = ConcreteTableSchema extends TableSchema<infer Columns> ? {
    [columnName in keyof Columns]: DeriveBuiltinType<Columns[columnName]>;
} : never;
export declare type NewTableRow<ConcreteTableSchema extends TableSchema<any>> = ConcreteTableSchema extends TableSchema<infer Columns> ? {
    [columnName in MandatoryColumnsNames<Columns>]: DeriveBuiltinType<Columns[columnName]>;
} & {
    [columnName in ColumnsWithDefaultsNames<Columns>]?: DeriveBuiltinType<Columns[columnName]>;
} : never;
interface SchemaTypes {
    Any: {
        type: ColumnType.Any;
    };
    Boolean: {
        type: ColumnType.Boolean;
    };
    Date: {
        type: ColumnType.Date;
    };
    Number: {
        type: ColumnType.Number;
    };
    String: {
        type: ColumnType.String;
    };
    Array<SubType extends ColumnDescription<any, any, any, any>>(subtype: SubType): ColumnDescription<ColumnType.Array, SubType, any, any>;
    Enum<T extends string | number>(values: T[]): ColumnDescription<ColumnType.Enum, any, T, any>;
    JSON<SubType extends ColumnDescription<any, any, any, any>>(subtype: SubType): ColumnDescription<ColumnType.JSON, SubType, any, any>;
    Object<Props extends ObjectShape>(props: Props): ColumnDescription<ColumnType.Object, any, any, Props>;
    default<Column extends ColumnDescription<any, any, any, any>>(column: Column): Column & {
        hasDefault: true;
    };
    nullable<Column extends ColumnDescription<any, any, any, any>>(column: Column): Column & {
        hasDefault: true;
        nullable: true;
    };
}
export declare const Schema: SchemaTypes;
export declare function defineTable<Columns extends TableSchemaDescription>(tableName: string, schema: Columns): TableSchema<Columns>;
export declare function getAllTableSchemas(): TableSchema<any>[];
export {};
