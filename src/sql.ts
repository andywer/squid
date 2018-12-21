export interface SqlRawExpressionValue {
  type: Symbol,
  subtype: Symbol,
  rawValue: string
}

export interface SqlAndSpread<RecordType> {
  type: Symbol,
  subtype: Symbol,
  record: RecordType
}

export interface SqlInsertValuesSpread<RecordType> {
  type: Symbol,
  subtype: Symbol,
  record: RecordType
}

export type SqlSpecialExpressionValue = SqlInsertValuesSpread<any> | SqlRawExpressionValue

export const $sqlExpressionValue = Symbol('SQL expression value')
export const $sqlSpreadAnd = Symbol('SQL AND spread')
export const $sqlSpreadInsert = Symbol('SQL INSERT values')
export const $sqlRawExpressionValue = Symbol('SQL raw expression value')

export const isInsertValuesExpression = (expression: SqlSpecialExpressionValue): expression is SqlInsertValuesSpread<any> =>
  expression.type === $sqlExpressionValue && expression.subtype === $sqlSpreadInsert

export const isAndSpreadExpression = (expression: SqlSpecialExpressionValue): expression is SqlInsertValuesSpread<any> =>
  expression.type === $sqlExpressionValue && expression.subtype === $sqlSpreadAnd

export const isRawExpressionValue = (expression: SqlSpecialExpressionValue): expression is SqlRawExpressionValue =>
  expression.type === $sqlExpressionValue && expression.subtype === $sqlRawExpressionValue

export const isSpecialExpression = (expression: any): expression is SqlSpecialExpressionValue =>
  expression && typeof expression === 'object' && expression.type === $sqlExpressionValue
