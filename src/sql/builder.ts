import { QueryConfig } from "./config"

export interface SqlBuilder<T = any> {
  $type: symbol
  values: T[]
  buildText(nextParamID: number): string
}

const $sqlBuilderSymbol = Symbol("SqlBuilder")

function mkSqlBuilder<T = any>(
  values: T[],
  buildText: (nextParamID: number) => string
): SqlBuilder<T> {
  return {
    $type: $sqlBuilderSymbol,
    values,
    buildText
  }
}

function isSqlBuilder(builder: any): builder is SqlBuilder {
  return builder && builder.$type === $sqlBuilderSymbol
}

/**
 * Generate the full SQL query.
 */
export function buildSql<T>(builder: SqlBuilder<T>): QueryConfig<T> {
  return {
    text: builder.buildText(1),
    values: builder.values
  }
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
export function joinSql<T>(builders: Array<SqlBuilder<T>>, delimiter = ""): SqlBuilder<T> {
  return mkSqlBuilder(
    builders.reduce((acc, { values }) => acc.concat(values), [] as T[]),
    nextParamID => {
      let paramID = nextParamID
      const builtText: string[] = []

      builders.forEach(({ buildText, values }) => {
        builtText.push(buildText(paramID))
        paramID += values.length
      })

      return builtText.join(delimiter)
    }
  )
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
  return mkSqlBuilder([], () => value)
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
  return mkSqlBuilder([value], nextParamID => "$" + nextParamID.toString())
}
