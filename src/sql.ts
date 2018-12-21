import createDebugLogger from 'debug'
import { PgQueryConfig } from './types'

interface SqlRawExpressionValue {
  type: Symbol,
  subtype: Symbol,
  rawValue: string
}

interface SqlAndSpread<RecordType> {
  type: Symbol,
  subtype: Symbol,
  record: RecordType
}

interface SqlInsertValuesSpread<RecordType> {
  type: Symbol,
  subtype: Symbol,
  record: RecordType
}

type SqlSpecialExpressionValue = SqlInsertValuesSpread<any> | SqlRawExpressionValue

const $sqlExpressionValue = Symbol('SQL expression value')
const $sqlSpreadAnd = Symbol('SQL AND spread')
const $sqlSpreadInsert = Symbol('SQL INSERT values')
const $sqlRawExpressionValue = Symbol('SQL raw expression value')

const debugQuery = createDebugLogger('sqldb:query')

const isInsertValuesExpression = (expression: SqlSpecialExpressionValue): expression is SqlInsertValuesSpread<any> =>
  expression.type === $sqlExpressionValue && expression.subtype === $sqlSpreadInsert

const isAndSpreadExpression = (expression: SqlSpecialExpressionValue): expression is SqlInsertValuesSpread<any> =>
  expression.type === $sqlExpressionValue && expression.subtype === $sqlSpreadAnd

const isRawExpressionValue = (expression: SqlSpecialExpressionValue): expression is SqlRawExpressionValue =>
  expression.type === $sqlExpressionValue && expression.subtype === $sqlRawExpressionValue

const isSpecialExpression = (expression: any): expression is SqlSpecialExpressionValue =>
  expression && typeof expression === 'object' && expression.type === $sqlExpressionValue

function escapeIdentifier (identifier: string) {
  if (identifier.charAt(0) === '"' && identifier.charAt(identifier.length - 1) === '"') {
    identifier = identifier.substr(1, identifier.length - 2)
  }
  if (identifier.includes('"')) {
    throw new Error(`Invalid identifier: ${identifier}`)
  }
  return `"${identifier}"`
}

function objectEntries<T extends { [key: string]: Value }, Value = any> (object: T): [string, Value][] {
  const keys = Object.keys(object)
  return keys.map(key => [key, object[key]] as [string, Value])
}

function pushSqlParameter (parameterValues: any[], value: any) {
  parameterValues.push(value)
  return `\$${parameterValues.length}`
}

function serializeSqlSpecialExpression (expression: SqlSpecialExpressionValue, parameterValues: any[]): string {
  if (isInsertValuesExpression(expression)) {
    const insertionValues = objectEntries<any>(expression.record)
    return (
      `(${insertionValues.map(([columnName]) => escapeIdentifier(columnName)).join(', ')})` +
      ` VALUES ` +
      `(${insertionValues.map(([, columnValue]) => pushSqlParameter(parameterValues, columnValue)).join(', ')})`
    )
  } else if (isAndSpreadExpression(expression)) {
    const columnValues = objectEntries<any>(expression.record)
    const andChain = columnValues
      .map(([ columnName, columnValue ]) => `${escapeIdentifier(columnName)} = ${serializeSqlTemplateExpression(columnValue, parameterValues)}`)
      .join(' AND ')
    return `(${andChain})`
  } else if (isRawExpressionValue(expression)) {
    return expression.rawValue
  } else {
    throw new Error(`Invalid SQL special expression subtype: ${(expression as SqlSpecialExpressionValue).subtype}`)
  }
}

function serializeSqlTemplateExpression (expression: any, parameterValues: any[]) {
  if (isSpecialExpression(expression)) {
    return serializeSqlSpecialExpression(expression, parameterValues)
  } else {
    return pushSqlParameter(parameterValues, expression)
  }
}

export function sql (texts: TemplateStringsArray, ...values: any[]): PgQueryConfig {
  let resultingSqlQuery = texts[0]
  const parameterValues: any[] = []

  for (let valueIndex = 0; valueIndex < values.length; valueIndex++) {
    const expression = values[valueIndex]
    const followingSqlText = texts[valueIndex + 1] as string | undefined

    resultingSqlQuery += serializeSqlTemplateExpression(expression, parameterValues) + (followingSqlText || '')
  }

  const query = {
    text: resultingSqlQuery,
    values: parameterValues
  }

  debugQuery(query)
  return query
}

export function raw (rawValue: string): SqlRawExpressionValue {
  return {
    type: $sqlExpressionValue,
    subtype: $sqlRawExpressionValue,
    rawValue
  }
}

sql.raw = raw

export function spreadAnd<RecordType> (record: RecordType): SqlAndSpread<RecordType> {
  return {
    type: $sqlExpressionValue,
    subtype: $sqlSpreadAnd,
    record
  }
}

export function spreadInsert<RecordType> (record: RecordType): SqlInsertValuesSpread<RecordType> {
  return {
    type: $sqlExpressionValue,
    subtype: $sqlSpreadInsert,
    record
  }
}
