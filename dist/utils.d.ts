/**
 * Escape the given identifier.
 */
export declare function escapeIdentifier(identifier: string): string;
export declare type ValueRecord<T = any> = Record<string, T>;
/**
 * Get the entries of the given object, filtering out undefined values.
 */
export declare function objectEntries<Value = any>(object: ValueRecord<Value>): Array<[string, Value]>;
/**
 * Merge two lists, alternating between elements.
 *
 * @example
 * mergeLists([x1, x2, x3], [y1, y2, y3]) == [x1, y1, x2, y2, x3, y3]
 */
export declare function mergeLists<T>(list1: ReadonlyArray<T>, list2: ReadonlyArray<T>): T[];
