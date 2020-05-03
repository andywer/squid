import { QueryConfig } from "./config"

export interface SqlBuilder<T = any> {
  $type: symbol
  buildFragment(nextParamID: number): QueryConfig<T>
}

const $sqlBuilderSymbol = Symbol("SqlBuilder")

export function mkSqlBuilder<T = any>(
  buildFragment: (nextParamID: number) => QueryConfig<T>
): SqlBuilder<T> {
  return {
    $type: $sqlBuilderSymbol,
    buildFragment
  }
}

export function isSqlBuilder(builder: any): builder is SqlBuilder {
  return builder && builder.$type === $sqlBuilderSymbol
}

/**
 * Build the given value. If it's a SqlBuilder, run buildFragment, otherwise
 * build it as a SQL parameter.
 */
export function buildSql<T>(value: SqlBuilder<T> | T, nextParamID: number): QueryConfig<T> {
  const builder = isSqlBuilder(value) ? value : paramSqlBuilder(value)
  return builder.buildFragment(nextParamID)
}

/**
 * A SqlBuilder that renders the given value directly.
 */
export function rawSqlBuilder(value: string): SqlBuilder<string> {
  return mkSqlBuilder(() => ({
    text: value,
    values: []
  }))
}

/**
 * A SqlBuilder that marks the given value to be parametrized.
 */
export function paramSqlBuilder<T>(value: T): SqlBuilder<T> {
  return mkSqlBuilder(nextParamID => ({
    text: "$" + nextParamID.toString(),
    values: [value]
  }))
}
