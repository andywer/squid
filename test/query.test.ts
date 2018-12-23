import test from "ava"
import { spreadAnd, spreadInsert, sql } from "../src/pg"

test("sql template tag creates a valid postgres query", t => {
  t.deepEqual(sql`SELECT email FROM users WHERE id = ${1}`, {
    text: "SELECT email FROM users WHERE id = $1",
    values: [1]
  })
})

test("sql.raw() works", t => {
  t.deepEqual(sql`SELECT email FROM users WHERE id = ${sql.raw("1")}`, {
    text: "SELECT email FROM users WHERE id = 1",
    values: []
  })
})

test("spreadAnd() works", t => {
  t.deepEqual(sql`SELECT * FROM users WHERE ${spreadAnd({ name: "Hugo", age: 20 })}`, {
    text: `SELECT * FROM users WHERE ("name" = $1 AND "age" = $2)`,
    values: ["Hugo", 20]
  })
})

test("spreadInsert() works", t => {
  t.deepEqual(sql`INSERT INTO users ${spreadInsert({ name: "Hugo", age: 20 })} RETURNING *`, {
    text: `INSERT INTO users ("name", "age") VALUES ($1, $2) RETURNING *`,
    values: ["Hugo", 20]
  })
})
