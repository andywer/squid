import { QueryConfig } from "./config"

export interface SqlBuilder<T = any> {
  $type: symbol
  buildFragment(nextParamID: number): QueryConfig<T>
}

const $sqlBuilderSymbol = Symbol("SqlBuilder")

function mkSqlBuilder<T = any>(
  buildFragment: (nextParamID: number) => QueryConfig<T>
): SqlBuilder<T> {
  return {
    $type: $sqlBuilderSymbol,
    buildFragment
  }
}

function isSqlBuilder(builder: any): builder is SqlBuilder {
  return builder && builder.$type === $sqlBuilderSymbol
}

/**
 * Merge the given SqlBuilders, concatenating the text values and parametrized
 * values.
 *
 * @example
 * const builder = joinSql([rawSqlBuilder("foo = "), paramSqlBuilder("bar")])
 * builder.buildFragment(1) ==> {
 *   text: "foo = $1",
 *   values: ["bar"]
 * }
 *
 * @example
 * const builder = joinSql(
 *   [rawSqlBuilder("foo"), paramSqlBuilder("bar")]
 *   " = "
 * )
 * builder.buildFragment(1) ==> {
 *   text: "foo = $1",
 *   values: ["bar"]
 * }
 */
export function joinSql(builders: SqlBuilder[], delimiter = ""): SqlBuilder {
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
      text: builtText.join(delimiter),
      values: builtValues
    }
  })
}

/**
 * Transform the text content in the given SqlBuilder.
 *
 * @example
 * const builder = transformSql(paramSqlBuilder("hello"), text => `(${text})`)
 * builder.buildFragment(1) ==> {
 *   text: "($1)",
 *   values: [value]
 * }
 */
export function transformSql(builder: SqlBuilder, callback: (text: string) => string): SqlBuilder {
  return mkSqlBuilder(nextParamID => {
    const { text, values } = builder.buildFragment(nextParamID)
    return {
      text: callback(text),
      values
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
 * A SqlBuilder that renders the given value directly.
 *
 * @example
 * rawSqlBuilder("hello").buildFragment(1) ==> {
 *   text: "hello",
 *   values: []
 * }
 */
export function rawSqlBuilder(value: string): SqlBuilder<string> {
  return mkSqlBuilder(() => ({
    text: value,
    values: []
  }))
}

/**
 * A SqlBuilder that marks the given value to be parametrized.
 *
 * @example
 * paramSqlBuilder("hello").buildFragment(1) ==> {
 *   text: "$1",
 *   values: ["hello"]
 * }
 */
export function paramSqlBuilder<T>(value: T): SqlBuilder<T> {
  return mkSqlBuilder(nextParamID => ({
    text: "$" + nextParamID.toString(),
    values: [value]
  }))
}
