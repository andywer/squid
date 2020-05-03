/**
 * Escape the given identifier.
 */
export declare function escapeIdentifier(identifier: string): string;
export declare type ValueRecord<T = any> = Record<string, T>;
/**
 * Filter out all undefined keys in the given record.
 */
export declare function filterUndefined<Value = any>(object: ValueRecord<Value>): ValueRecord<Value>;
/**
 * Merge two lists, alternating between elements.
 *
 * @example
 * mergeLists([x1, x2, x3], [y1, y2, y3]) == [x1, y1, x2, y2, x3, y3]
 */
export declare function mergeLists<T>(list1: ReadonlyArray<T>, list2: ReadonlyArray<T>): T[];
/**
 * Get the keys from the given list of objects. Checks that the objects all
 * have the same keys.
 */
export declare function extractKeys<Value = any>(objects: Array<ValueRecord<Value>>): string[];
