/**
 * Escape the given identifier.
 */
export function escapeIdentifier(identifier: string) {
  if (identifier.charAt(0) === '"' && identifier.charAt(identifier.length - 1) === '"') {
    identifier = identifier.substr(1, identifier.length - 2)
  }
  if (identifier.includes('"')) {
    throw new Error(`Invalid identifier: ${identifier}`)
  }
  return `"${identifier}"`
}

export type ValueRecord<T = any> = Record<string, T>

/**
 * Get the entries of the given object, optionally filtering out undefined values.
 */
export function objectEntries<Value = any>(
  object: ValueRecord<Value>,
  filterUndefinedValues?: boolean
): Array<[string, Value]> {
  const keys = Object.keys(object)
  const entries = keys.map(key => [key, object[key]] as [string, Value])

  return filterUndefinedValues
    ? entries.filter(([, columnValue]) => typeof columnValue !== "undefined")
    : entries
}

/**
 * Merge two lists, alternating between elements.
 *
 * @example
 * mergeLists([x1, x2, x3], [y1, y2, y3]) == [x1, y1, x2, y2, x3, y3]
 */
export function mergeLists<T>(list1: ReadonlyArray<T>, list2: ReadonlyArray<T>): T[] {
  const result: T[] = []

  for (let i = 0; i < Math.max(list1.length, list2.length); i++) {
    const elem1 = list1[i]
    if (elem1 !== undefined) {
      result.push(elem1)
    }

    const elem2 = list2[i]
    if (elem2 !== undefined) {
      result.push(elem2)
    }
  }

  return result
}
