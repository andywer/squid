import { QueryConfig, SqlSpecialExpressionValue } from "./internals"
export { QueryConfig }
declare type PgQueryConfig = QueryConfig
export declare function sql(texts: TemplateStringsArray, ...values: any[]): PgQueryConfig
export declare namespace sql {
  var raw: typeof rawExpression
}
declare function rawExpression(rawValue: string): SqlSpecialExpressionValue
export { rawExpression as raw }
export declare function spreadAnd(record: any): SqlSpecialExpressionValue
export declare function spreadInsert(record: any): SqlSpecialExpressionValue
