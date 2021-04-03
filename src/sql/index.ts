import createDebugLogger from "debug"
import { escapeIdentifier, extractKeys, filterUndefined, mergeLists, ValueRecord } from "../utils"
import { QueryConfig } from "./config"
import {
  SqlBuilder,
  buildSql,
  joinSql,
  paramSqlBuilder,
  rawSqlBuilder,
  toSqlBuilder
} from "./builder"

export { QueryConfig, SqlBuilder }

export type PgQueryConfig = QueryConfig

const debugQuery = createDebugLogger("squid:query")

/**
 * SQL template string tag. Returns a query object: `{ text: string, values: any[] }`.
 * Template expressions are automatically SQL-injection-proofed unless wrapped in `sql.raw()`.
 *
 * @example
 * const { rows } = await database.query(sql`SELECT name, email FROM users WHERE id=${userID}`)
 * @example
 * const { rows } = await database.query<{ name: string, email: string }>(sql`
 *   SELECT name, email FROM users WHERE id=${userID}
 * `)
 */
export function sql(texts: TemplateStringsArray, ...values: any[]): PgQueryConfig {
  const sqlBuilder = sqlBuild(texts, ...values)
  const query = buildSql(sqlBuilder)

  debugQuery(query)
  return query
}

/**
 * Internal template string tag that builds a SqlBuilder.
 */
function sqlBuild(texts: TemplateStringsArray, ...values: any[]): SqlBuilder {
  // General idea:
  //   sql`foo ${1} bar ${sql.raw(2)}`
  // =>
  //   sql(['foo ', ' bar ', ''], [1, rawSqlBuilder(2)])
  // =>
  //   [rawSqlBuilder('foo '), rawSqlBuilder(' bar '), rawSqlBuilder('')]
  //   [paramSqlBuilder(1), rawSqlBuilder(2)]
  // =>
  //   [
  //     rawSqlBuilder('foo '),
  //     paramSqlBuilder(1),
  //     rawSqlBuilder(' bar '),
  //     rawSqlBuilder(2),
  //     rawSqlBuilder(''),
  //   ]

  const textSqlBuilders = texts.map(rawSqlBuilder)
  const valueSqlBuilders = values.map(toSqlBuilder)

  const sqlBuilders = mergeLists(textSqlBuilders, valueSqlBuilders)

  return joinSql(sqlBuilders)
}

/**
 * Wrap an SQL template expression value in `sql.raw()` to inject the raw value into the query.
 * Attention: Can easily lead to SQL injections! Use with caution and only if necessary.
 */
function rawExpression(rawValue: string): SqlBuilder {
  return rawSqlBuilder(rawValue)
}

function safeExpression<T>(value: T): SqlBuilder<T> {
  return paramSqlBuilder(value)
}

export { rawExpression as raw, safeExpression as safe }

sql.raw = rawExpression
sql.safe = safeExpression

/**
 * Convenience function to keep WHERE clauses concise. Takes an object:
 * Keys are supposed to be a column name, values the values that the record must have set.
 *
 * @example
 * const { rows } = await database.query(sql`SELECT * FROM users WHERE ${spreadAnd({ name: "John", email: "john@example.com" })}`)
 */
export function spreadAnd<T>(record: any): SqlBuilder<T> {
  const columnValues = Object.entries(filterUndefined(record))

  const andChainBuilders = columnValues.map(([columnName, columnValue]) => {
    const identifier = escapeIdentifier(columnName)
    return sqlBuild`${sql.raw(identifier)} = ${columnValue}`
  })

  const andChain = joinSql(andChainBuilders, " AND ")

  return sqlBuild`(${andChain})`
}

/**
 * Convenience function to keep INSERT statements concise.
 * @example
 * await database.query(sql`INSERT INTO users ${spreadInsert({ name: "John", email: "john@example.com" })}`)
 */
export function spreadInsert<T>(...records: ValueRecord[]): SqlBuilder<T> {
  const columnNames = extractKeys(records.map(filterUndefined))
  const identifiers = columnNames.map(escapeIdentifier).join(", ")

  const insertChainBuilders = records.map(record => {
    const recordColumns = columnNames.map(columnName => toSqlBuilder(record[columnName]))
    return sqlBuild`(${joinSql(recordColumns, ", ")})`
  })

  const insertChain = joinSql(insertChainBuilders, ", ")

  return sqlBuild`(${sql.raw(identifiers)}) VALUES ${insertChain}`
}

/**
 * Convenience function to keep UPDATE statements concise. Takes an object:
 * @example
 * await database.query(sql`UPDATE users SET ${spreadUpdate({ name: "John", email: "john@example.com" })} WHERE id = 1`)
 */
export function spreadUpdate(record: any): SqlBuilder {
  const updateValues = Object.entries(filterUndefined(record))

  const updateChainBuilders = updateValues.map(([columnName, columnValue]) => {
    const identifier = escapeIdentifier(columnName)
    return sqlBuild`${sql.raw(identifier)} = ${columnValue}`
  })

  return joinSql(updateChainBuilders, ", ")
}
