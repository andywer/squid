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
 * Merge the given SqlBuilders, concatenating the text values and parametrized
 * values.
 */
export function joinSql(builders: SqlBuilder[]): SqlBuilder {
  return mkSqlBuilder(nextParamID => {
    let paramID = nextParamID
    const builtText: string[] = []
    const builtValues: any[] = []

    builders.forEach(builder => {
      const { text, values } = builder.buildFragment(paramID)
      paramID += values.length
      builtText.push(text)
      builtValues.push(...values)
    })

    return {
      text: builtText.join(""),
      values: builtValues
    }
  })
}

/**
 * Convert the given value to a SqlBuilder if it's not already.
 */
export function toSqlBuilder<T>(value: SqlBuilder<T> | T): SqlBuilder<T> {
  return isSqlBuilder(value) ? value : paramSqlBuilder(value)
}

/**
 * Build the given value. If it's a SqlBuilder, run buildFragment, otherwise
 * build it as a SQL parameter.
 */
export function buildSql<T>(value: SqlBuilder<T> | T, nextParamID: number): QueryConfig<T> {
  return toSqlBuilder(value).buildFragment(nextParamID)
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
