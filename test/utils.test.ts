import test from "ava"
import { mergeLists } from "../src/utils"

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
