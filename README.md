# sqldb

Provides SQL tagged template strings and schema definition code for JavaScript and TypeScript.

Supports Postgres only as of now. Create an issue or pull request if you need support for another database.

Use [`pg-lint`](https://github.com/andywer/pg-lint) to validate SQL queries in your code against your table schemas at build time 🚀


## Usage

```js
import { defineTable } from "sqldb/schema"
import { spreadInsert, sql } from "sqldb/sql"

const usersTable = defineTable("users", {
  id: Schema.Number,
  name: Schema.String
})

export async function queryUserById (id) {
  const { rows } = await database.query(sql`
    SELECT * FROM users WHERE id = ${id}
  `)
  return rows.length > 0 ? rows[0] : null
}

export async function createUser (record) {
  const { rows } = await database.query(sql`
    INSERT INTO users ${spreadInsert(record)} RETURNING *
  `)
  return rows[0]
}
```


## Template values

All expressions in the SQL template strings will be escaped properly automatically, so you don't need to worry about SQL injection attacks too much.

If you need to pass a value dynamically that should not be escaped, you can use `sql.raw`:

```js
async function updateTimestamp (userID, timestamp = null) {
  await database.query(sql`
    UPDATE users
    SET timestamp = ${timestamp || sql.raw("NOW()")}
    WHERE id = ${userID}
  `)
}
```


## Performance

The performance impact of using the template string is neglectible. Benchmarked it once and it did 1000 queries in ~6ms on my MacBook Pro.


## Debugging

Set the environment variable `DEBUG` to `sqldb:*` to enable debug logging for this package.


## License

MIT
