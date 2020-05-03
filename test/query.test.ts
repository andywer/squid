import test from "ava"
import dedent from "dedent"
import { spreadAnd, spreadInsert, spreadUpdate, sql, QueryConfig } from "../src/pg"

function matches(t: any, actual: QueryConfig, expectedText: string, expectedValues: any[]) {
  t.is(dedent(actual.text), dedent(expectedText))
  t.deepEqual(actual.values, expectedValues)
}

const dedentQueryConfig = (queryConfig: QueryConfig) => ({
  ...queryConfig,
  text: dedent(queryConfig.text)
})

test("sql template tag creates a valid postgres query", t => {
  matches(
    t,
    sql`SELECT email FROM users WHERE id = ${1}`,
    "SELECT email FROM users WHERE id = $1",
    [1]
  )
})

test("sql.safe() works", t => {
  matches(
    t,
    sql`SELECT email FROM users WHERE id = ${sql.safe(1)}`,
    "SELECT email FROM users WHERE id = $1",
    [1]
  )

  t.deepEqual(
    `SELECT email FROM users WHERE id = ${sql.safe(1)}`,
    `SELECT email FROM users WHERE id = [object Object]`
  )
})

test("sql.raw() works", t => {
  matches(
    t,
    sql`SELECT email FROM users WHERE id = ${sql.raw("1")}`,
    "SELECT email FROM users WHERE id = 1",
    []
  )
})

test("spreadAnd() works", t => {
  matches(
    t,
    sql`
      SELECT * FROM users WHERE ${spreadAnd({
        name: "Hugo",
        age: 20,
        email: sql.raw("'foo@example.com'"),
        foo: undefined
      })}
    `,
    `SELECT * FROM users WHERE ("name" = $1 AND "age" = $2 AND "email" = 'foo@example.com')`,
    ["Hugo", 20]
  )
})

test("spreadInsert() works", t => {
  matches(
    t,
    sql`
      INSERT INTO users ${spreadInsert({
        name: "Hugo",
        age: 20,
        created_at: sql.raw("NOW()"),
        foo: undefined
      })} RETURNING *
    `,
    `INSERT INTO users ("name", "age", "created_at") VALUES ($1, $2, NOW()) RETURNING *`,
    ["Hugo", 20]
  )
})

test("spreadInsert() works with multiple inserts", t => {
  matches(
    t,
    sql`
      INSERT INTO users ${spreadInsert(
        {
          name: "Hugo",
          age: 20,
          created_at: sql.raw("NOW()"),
          foo: undefined
        },
        {
          age: 25,
          name: "Jon",
          foo: undefined,
          created_at: sql.raw("NOW()")
        },
        {
          bar: 1,
          age: 27,
          name: "Hans",
          created_at: null
        }
      )} RETURNING *
    `,
    `INSERT INTO users ("name", "age", "created_at") VALUES ($1, $2, NOW()), ($3, $4, NOW()), ($5, $6, $7) RETURNING *`,
    ["Hugo", 20, "Jon", 25, "Hans", 27, null]
  )
})

test("spreadUpdate() works", t => {
  matches(
    t,
    sql`
      UPDATE users SET ${spreadUpdate({
        name: "Hugo",
        age: 20,
        created_at: sql.raw("NOW()"),
        foo: undefined
      })}
    `,
    `UPDATE users SET "name" = $1, "age" = $2, "created_at" = NOW()`,
    ["Hugo", 20]
  )
})

test("works with multiple parameters", t => {
  matches(
    t,
    sql`
      WITH some_users AS (
        SELECT * FROM users WHERE id = ${1} OR email = ${"foo@example.com"}
      )
      INSERT INTO users ${spreadInsert({
        name: "Hugo",
        age: 20,
        created_at: sql.raw("NOW()"),
        role: "user"
      })} UNION SELECT * FROM some_users RETURNING *
    `,
    `
      WITH some_users AS (
        SELECT * FROM users WHERE id = $1 OR email = $2
      )
      INSERT INTO users ("name", "age", "created_at", "role") VALUES ($3, $4, NOW(), $5) UNION SELECT * FROM some_users RETURNING *
    `,
    [1, "foo@example.com", "Hugo", 20, "user"]
  )
})
