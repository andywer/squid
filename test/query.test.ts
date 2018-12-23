import test from "ava"
import dedent from "dedent"
import { spreadAnd, spreadInsert, sql, QueryConfig } from "../src/pg"

const dedentQueryConfig = (queryConfig: QueryConfig) => ({
  ...queryConfig,
  text: dedent(queryConfig.text)
})

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
  t.deepEqual(
    dedentQueryConfig(sql`
    SELECT * FROM users WHERE ${spreadAnd({
      name: "Hugo",
      age: 20,
      email: sql.raw("'foo@example.com'")
    })}
  `),
    dedentQueryConfig({
      text: `SELECT * FROM users WHERE ("name" = $1 AND "age" = $2 AND "email" = 'foo@example.com')`,
      values: ["Hugo", 20]
    })
  )
})

test("spreadInsert() works", t => {
  t.deepEqual(
    dedentQueryConfig(sql`
    INSERT INTO users ${spreadInsert({
      name: "Hugo",
      age: 20,
      created_at: sql.raw("NOW()")
    })} RETURNING *
  `),
    dedentQueryConfig({
      text: `INSERT INTO users ("name", "age", "created_at") VALUES ($1, $2, NOW()) RETURNING *`,
      values: ["Hugo", 20]
    })
  )
})

test("works with multiple parameters", t => {
  t.deepEqual(
    dedentQueryConfig(sql`
    WITH some_users AS (
      SELECT * FROM users WHERE id = ${1} OR email = ${"foo@example.com"}
    )
    INSERT INTO users ${spreadInsert({
      name: "Hugo",
      age: 20,
      created_at: sql.raw("NOW()"),
      role: "user"
    })} UNION SELECT * FROM some_users RETURNING *
  `),
    dedentQueryConfig({
      text: `
    WITH some_users AS (
      SELECT * FROM users WHERE id = $1 OR email = $2
    )
    INSERT INTO users ("name", "age", "created_at", "role") VALUES ($3, $4, NOW(), $5) UNION SELECT * FROM some_users RETURNING *
    `,
      values: [1, "foo@example.com", "Hugo", 20, "user"]
    })
  )
})
