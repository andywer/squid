export interface QueryConfig {
  text: string
  values: any[]
}

export interface SqlSpecialExpressionValue {
  type: symbol
  buildFragment(nextParamID: number): QueryConfig
}

export const $sqlExpressionValue = Symbol("SQL expression value")

export const isSpecialExpression = (expression: any): expression is SqlSpecialExpressionValue =>
  expression && typeof expression === "object" && expression.type === $sqlExpressionValue
