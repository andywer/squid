import createDebugLogger from "debug"
import { escapeIdentifier, mergeLists, objectEntries } from "../utils"
import {
  $sqlExpressionValue,
  isSpecialExpression,
  QueryConfig,
  SqlSpecialExpressionValue
} from "./internals"

export { QueryConfig }

type PgQueryConfig = QueryConfig
interface ValueRecord<T = any> {
  [key: string]: T
}

const debugQuery = createDebugLogger("squid:query")

function serializeSqlTemplateExpression(expression: any, nextParamID: number): QueryConfig {
  const values: any[] = []

  if (isSpecialExpression(expression)) {
    return expression.buildFragment(nextParamID)
  } else {
    const text = pushSqlParameter(nextParamID, values, expression)
    return {
      text,
      values
    }
  }
}

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
  const parameterValues: any[] = []

  const serializedValues = values.map(expression => {
    const nextParamID = parameterValues.length + 1

    const serialized = serializeSqlTemplateExpression(expression, nextParamID)

    parameterValues.push(...serialized.values)

    return serialized.text
  })

  const query = {
    text: mergeLists(texts, serializedValues).join(""),
    values: parameterValues
  }

  debugQuery(query)
  return query
}

/**
 * Wrap an SQL template expression value in `sql.raw()` to inject the raw value into the query.
 * Attention: Can easily lead to SQL injections! Use with caution and only if necessary.
 */
function rawExpression(rawValue: string): SqlSpecialExpressionValue {
  return {
    type: $sqlExpressionValue,
    buildFragment() {
      return {
        text: rawValue,
        values: []
      }
    }
  }
}

function safeExpression<T>(value: T): SqlSpecialExpressionValue {
  return {
    type: $sqlExpressionValue,
    buildFragment(paramID: number) {
      return {
        text: `\$${paramID}`,
        values: [value]
      }
    }
  }
}

export { rawExpression as raw, safeExpression as safe }

sql.raw = rawExpression
sql.safe = safeExpression

function pushSqlParameter(nextParamID: number, parameterValues: any[], value: any) {
  parameterValues.push(value)
  return `\$${nextParamID}`
}

function buildSpreadAndFragment(
  columnValues: Array<[string, any]>,
  nextParamID: number
): QueryConfig {
  let values: any[] = []
  const andChain = columnValues
    .map(([columnName, columnValue]) => {
      const serialized = serializeSqlTemplateExpression(columnValue, nextParamID)
      values = [...values, ...serialized.values]
      nextParamID += serialized.values.length
      return `${escapeIdentifier(columnName)} = ${serialized.text}`
    })
    .join(" AND ")
  return {
    text: `(${andChain})`,
    values
  }
}

function buildSpreadInsertFragment(
  columns: string[],
  records: ValueRecord[],
  nextParamID: number
): QueryConfig {
  let values: any[] = []
  const text =
    `(${columns.map(columnName => escapeIdentifier(columnName)).join(", ")})` +
    ` VALUES ` +
    `(${records
      .map(record => {
        return columns
          .map(columnName => {
            const columnValue = record[columnName]
            if (typeof columnValue === "undefined") {
              throw new TypeError(`Missing value for column "${columnName}"`)
            }
            const serialized = serializeSqlTemplateExpression(columnValue, nextParamID)
            values = [...values, ...serialized.values]
            nextParamID += serialized.values.length
            return serialized.text
          })
          .join(", ")
      })
      .join("), (")})`
  return {
    text,
    values
  }
}

function buildSpreadUpdateFragment(
  updateValues: Array<[string, any]>,
  nextParamID: number
): QueryConfig {
  let values: any[] = []
  const settersChain = updateValues
    .map(([columnName, columnValue]) => {
      const serialized = serializeSqlTemplateExpression(columnValue, nextParamID)
      values = [...values, ...serialized.values]
      nextParamID += serialized.values.length
      return `${escapeIdentifier(columnName)} = ${serialized.text}`
    })
    .join(", ")
  return {
    text: `${settersChain}`,
    values
  }
}

/**
 * Extract colum names from a records.
 * Make sure all records has the same number of columns.
 */
function extractColumsName(records: ValueRecord[]) {
  const referenceRecord = records[0]
  if (records.some(record => Object.keys(record).length !== Object.keys(referenceRecord).length)) {
    throw new Error("Rows must be of the same length")
  }
  return Object.keys(referenceRecord).filter(
    columnName => typeof referenceRecord[columnName] !== "undefined"
  )
}

/**
 * Convenience function to keep WHERE clauses concise. Takes an object:
 * Keys are supposed to be a column name, values the values that the record must have set.
 *
 * @example
 * const { rows } = await database.query(sql`SELECT * FROM users WHERE ${spreadAnd({ name: "John", email: "john@example.com" })}`)
 */
export function spreadAnd(record: any): SqlSpecialExpressionValue {
  const values = objectEntries(record)
  return {
    type: $sqlExpressionValue,
    buildFragment(nextParamID: number) {
      return buildSpreadAndFragment(values, nextParamID)
    }
  }
}

/**
 * Convenience function to keep INSERT statements concise.
 * @example
 * await database.query(sql`INSERT INTO users ${spreadInsert({ name: "John", email: "john@example.com" })}`)
 */
export function spreadInsert(...records: ValueRecord[]): SqlSpecialExpressionValue {
  const colums = extractColumsName(records)
  return {
    type: $sqlExpressionValue,
    buildFragment(nextParamID: number) {
      return buildSpreadInsertFragment(colums, records, nextParamID)
    }
  }
}

/**
 * Convenience function to keep UPDATE statements concise. Takes an object:
 * @example
 * await database.query(sql`UPDATE users SET ${spreadUpdate({ name: "John", email: "john@example.com" })} WHERE id = 1`)
 */
export function spreadUpdate(record: any): SqlSpecialExpressionValue {
  const values = objectEntries(record)
  return {
    type: $sqlExpressionValue,
    buildFragment(nextParamID: number) {
      return buildSpreadUpdateFragment(values, nextParamID)
    }
  }
}
