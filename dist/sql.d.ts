import { QueryConfig, SqlSpecialExpressionValue } from "./internals";
export { QueryConfig };
declare type PgQueryConfig = QueryConfig;
/**
 * SQL template string tag. Returns a query object: `{ text: string, values: any[] }`.
 * Template expressions are automatically SQL-injection-proofed unless wrapped in `sql.raw()`.
 *
 * @example const { rows } = await database.query(sql`SELECT name, email FROM users WHERE id=${userID}`)
 */
export declare function sql(texts: TemplateStringsArray, ...values: any[]): PgQueryConfig;
export declare namespace sql {
    var raw: typeof rawExpression;
}
/**
 * Wrap an SQL template expression value in `sql.raw()` to inject the raw value into the query.
 * Attention: Can easily lead to SQL injections! Use with caution and only if necessary.
 */
declare function rawExpression(rawValue: string): SqlSpecialExpressionValue;
export { rawExpression as raw };
/**
 * Convenience function to keep WHERE clauses concise. Takes an object:
 * Keys are supposed to be a column name, values the values that the record must have set.
 *
 * @example const { rows } = await database.query(sql`SELECT * FROM users WHERE ${spreadAnd({ name: "John", email: "john@example.com" })}`)
 */
export declare function spreadAnd(record: any): SqlSpecialExpressionValue;
/**
 * Convenience function to keep INSERT statements concise.
 * @example await database.query(sql`INSERT INTO users ${spreadInsert({ name: "John", email: "john@example.com" })}`)
 */
export declare function spreadInsert(record: any): SqlSpecialExpressionValue;
