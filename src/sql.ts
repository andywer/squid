import createDebugLogger from "debug"
import {
  $sqlExpressionValue,
  isSpecialExpression,
  QueryConfig,
  SqlSpecialExpressionValue
} from "./internals"

export { QueryConfig }

type PgQueryConfig = QueryConfig

const debugQuery = createDebugLogger("sqldb:query")

function escapeIdentifier(identifier: string) {
  if (identifier.charAt(0) === '"' && identifier.charAt(identifier.length - 1) === '"') {
    identifier = identifier.substr(1, identifier.length - 2)
  }
  if (identifier.includes('"')) {
    throw new Error(`Invalid identifier: ${identifier}`)
  }
  return `"${identifier}"`
}

function objectEntries<T extends { [key: string]: Value }, Value = any>(
  object: T
): Array<[string, Value]> {
  const keys = Object.keys(object)
  return keys.map(key => [key, object[key]] as [string, Value])
}

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

export function sql(texts: TemplateStringsArray, ...values: any[]): PgQueryConfig {
  let parameterValues: any[] = []
  let resultingSqlQuery = texts[0]

  for (let valueIndex = 0; valueIndex < values.length; valueIndex++) {
    const expression = values[valueIndex]
    const followingSqlText = texts[valueIndex + 1] as string | undefined
    const nextParamID = parameterValues.length + 1

    const serialized = serializeSqlTemplateExpression(expression, nextParamID)
    resultingSqlQuery += serialized.text + (followingSqlText || "")

    parameterValues = [...parameterValues, ...serialized.values]
  }

  const query = {
    text: resultingSqlQuery,
    values: parameterValues
  }

  debugQuery(query)
  return query
}

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

export { rawExpression as raw }

sql.raw = rawExpression

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
  insertionValues: Array<[string, any]>,
  nextParamID: number
): QueryConfig {
  let values: any[] = []
  const text =
    `(${insertionValues.map(([columnName]) => escapeIdentifier(columnName)).join(", ")})` +
    ` VALUES ` +
    `(${insertionValues
      .map(([, columnValue]) => {
        const serialized = serializeSqlTemplateExpression(columnValue, nextParamID)
        values = [...values, ...serialized.values]
        nextParamID += serialized.values.length
        return serialized.text
      })
      .join(", ")})`
  return {
    text,
    values
  }
}

export function spreadAnd(record: any): SqlSpecialExpressionValue {
  const values = objectEntries<any>(record)
  return {
    type: $sqlExpressionValue,
    buildFragment(nextParamID: number) {
      return buildSpreadAndFragment(values, nextParamID)
    }
  }
}

export function spreadInsert(record: any): SqlSpecialExpressionValue {
  const insertionValues = objectEntries<any>(record)
  return {
    type: $sqlExpressionValue,
    buildFragment(nextParamID: number) {
      return buildSpreadInsertFragment(insertionValues, nextParamID)
    }
  }
}
