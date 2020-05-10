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
 * Filter out all undefined keys in the given record.
 */
export function filterUndefined<Value = any>(object: ValueRecord<Value>): ValueRecord<Value> {
  const filteredEntries = Object.entries(object).filter(([_, v]) => v !== undefined)

  // Object.fromEntries was added in ECMA2019
  return filteredEntries.reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
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

function objectKeys(object: object): Set<string> {
  return new Set(Object.keys(object))
}

function areSetsEqual<T>(set1: Set<T>, set2: Set<T>): boolean {
  const difference = new Set(set1)
  for (const elem of set2) {
    if (difference.has(elem)) {
      difference.delete(elem)
    } else {
      // FIXME: uncommenting this causes change in behavior, where spreadInsert()
      // currently allows extra keys to be specified in latter objects that will
      // be ignored
      // return false
    }
  }

  return difference.size === 0
}

/**
 * Get the keys from the given list of objects. Checks that the objects all
 * have the same keys.
 */
export function extractKeys<Value = any>(objects: Array<ValueRecord<Value>>): string[] {
  if (objects.length === 0) {
    throw new Error("Cannot call extractKeys on empty list")
  }

  const keys = objectKeys(objects[0])

  for (const o of objects) {
    const oKeys = objectKeys(o)
    if (!areSetsEqual(keys, oKeys)) {
      throw new Error(`Objects have different keys: ${JSON.stringify(objects)}`)
    }
  }

  return Array.from(keys)
}
