import test from "ava"
import { Pool } from "pg"
import { spreadAnd, spreadInsert, spreadUpdate, sql, QueryConfig } from "../src/pg"

const pool = new Pool()

test.beforeEach(async () => {
  await pool.query("DROP TABLE IF EXISTS squid_test")
})

test.afterEach.always(async () => {
  await pool.query("DROP TABLE IF EXISTS squid_test")
})

test("sql template tag creates a valid postgres query", async t => {
  await pool.query("CREATE TABLE squid_test ( id SERIAL, name VARCHAR )")
  await pool.query(`
    INSERT INTO squid_test (name) VALUES
      ('Alice'),
      ('Bob'),
      ('Charles')
  `)

  const { rows } = await pool.query(sql`
    SELECT id, name FROM squid_test WHERE id = ${1} OR name = ${sql.raw("'Charles'")}
  `)

  t.deepEqual(rows, [{ id: 1, name: "Alice" }, { id: 3, name: "Charles" }])
})
