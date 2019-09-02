import test from "ava"
import dedent from "dedent"
import { spreadAnd, spreadInsert, spreadUpdate, sql, QueryConfig } from "../src/pg"

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

test("sql.safe() works", t => {
  t.deepEqual(sql`SELECT email FROM users WHERE id = ${sql.safe(1)}`, {
    text: "SELECT email FROM users WHERE id = $1",
    values: [1]
  })
  t.deepEqual(
    `SELECT email FROM users WHERE id = ${sql.safe(1)}`,
    `SELECT email FROM users WHERE id = [object Object]`
  )
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
      email: sql.raw("'foo@example.com'"),
      foo: undefined
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
      created_at: sql.raw("NOW()"),
      foo: undefined
    })} RETURNING *
  `),
    dedentQueryConfig({
      text: `INSERT INTO users ("name", "age", "created_at") VALUES ($1, $2, NOW()) RETURNING *`,
      values: ["Hugo", 20]
    })
  )
})

test("spreadInsert() works with multiple inserts", t => {
  t.deepEqual(
    dedentQueryConfig(sql`
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
  `),
    dedentQueryConfig({
      text: `INSERT INTO users ("name", "age", "created_at") VALUES ($1, $2, NOW()), ($3, $4, NOW()), ($5, $6, $7) RETURNING *`,
      values: ["Hugo", 20, "Jon", 25, "Hans", 27, null]
    })
  )
})

test("spreadUpdate() works", t => {
  t.deepEqual(
    dedentQueryConfig(sql`
    UPDATE users SET ${spreadUpdate({
      name: "Hugo",
      age: 20,
      created_at: sql.raw("NOW()"),
      foo: undefined
    })}
  `),
    dedentQueryConfig({
      text: `UPDATE users SET "name" = $1, "age" = $2, "created_at" = NOW()`,
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
