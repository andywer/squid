import test from "ava"
import { escapeIdentifier, extractKeys, filterUndefined, mergeLists } from "../src/utils"

test("escapeIdentifier wraps in quotes", t => {
  t.is(escapeIdentifier("column"), '"column"')
})

test("escapeIdentifier does not modify an already escaped identifier", t => {
  t.is(escapeIdentifier('"column"'), '"column"')
})

test("escapeIdentifier errors if it finds quotes", t => {
  t.throws(() => {
    escapeIdentifier('a"b')
  })
})

test("mergeLists works on empty lists", t => {
  t.deepEqual(mergeLists([], []), [])
  t.deepEqual(mergeLists([1], []), [1])
  t.deepEqual(mergeLists([], [1]), [1])
})

test("mergeLists works on lists of the same length", t => {
  t.deepEqual(mergeLists([1, 2, 3], [4, 5, 6]), [1, 4, 2, 5, 3, 6])
})

test("mergeLists works on lists of different lengths", t => {
  t.deepEqual(mergeLists([1, 2, 3], [4, 5, 6, 7, 8]), [1, 4, 2, 5, 3, 6, 7, 8])
  t.deepEqual(mergeLists([1, 2, 3, 4, 5], [6, 7, 8]), [1, 6, 2, 7, 3, 8, 4, 5])
})

test("filterUndefined filters out undefined keys", t => {
  t.deepEqual(filterUndefined({ a: 1, b: undefined }), { a: 1 })
})

test("extractKeys returns the keys in the objects", t => {
  t.deepEqual(extractKeys([{ a: 1, b: 2 }, { a: 2, b: 4 }, { a: 3, b: 6 }]), ["a", "b"])
})

test("extractKeys errors on an empty list", t => {
  t.throws(() => {
    extractKeys([])
  })
})

test("extractKeys checks that the keys are all the same", t => {
  t.throws(() => {
    extractKeys([{ a: 1, b: 2 }, { a: 1 }])
  })

  t.throws(() => {
    extractKeys([{ a: 1 }, { a: 1, b: 2 }])
  })

  t.throws(() => {
    extractKeys([{ a: 1, b: 2 }, { a: 1, c: 2 }])
  })
})
