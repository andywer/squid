# sqldb

Provides SQL tagged template strings and schema definition code for JavaScript and TypeScript.

Parameters are always SQL-injection-proofed by default. You can explicitly opt-out, though, by wrapping the parameter value in `sql.raw()`.

Use [`pg-lint`](https://github.com/andywer/pg-lint) to validate SQL queries in your code against your table schemas at build time 🚀

Supports only Postgres right now, but it is easy to add support for MySQL, SQLite, ... as well. Create an issue or pull request if you need support for another database.

## Usage

```js
import { defineTable, sql, spreadInsert } from "sqldb/pg"

const usersTable = defineTable("users", {
  id: Schema.Number,
  name: Schema.String
})

export async function createUser(record) {
  const { rows } = await database.query(sql`
    INSERT INTO users ${spreadInsert(record)} RETURNING *
  `)
  return rows[0]
}

export async function queryUserById(id) {
  const { rows } = await database.query(sql`
    SELECT * FROM users WHERE id = ${id}
  `)
  return rows.length > 0 ? rows[0] : null
}
```

## Template values

All expressions in the SQL template strings will be escaped properly automatically, so you don't need to worry about SQL injection attacks too much.

If you need to pass a value dynamically that should not be escaped, you can use `sql.raw`:

```js
async function updateTimestamp(userID, timestamp = null) {
  await database.query(sql`
    UPDATE users
    SET timestamp = ${timestamp || sql.raw("NOW()")}
    WHERE id = ${userID}
  `)
}
```

## Examples

The `sql` template tag creates query objects compatible with [`pg`](https://node-postgres.com), the super popular Postgres driver for node.

```
> import { sql, spreadAnd, spreadInsert } from "sqldb/pg"

> sql`SELECT * FROM users WHERE ${spreadAnd({ name: "Andy", age: 29 })}`
{ text: "SELECT * FROM users WHERE ("name" = $1 AND "age" = $2)",
  values: [ "Andy", 29 ] }

> sql`INSERT INTO users ${spreadInsert({ name: "Andy", age: 29 })}`
{ text: "INSERT INTO users ("name", "age") VALUES ($1, $2)",
  values: [ "Andy", 29 ] }

> sql`SELECT * FROM users WHERE ${spreadAnd({ name: "Andy", age: sql.raw("29") })}`
{ text: "SELECT * FROM users WHERE ("name" = $1 AND "age" = 29)",
  values: [ "Andy" ] }
```

## API

### sql\`\`

Turns a template string into a postgres query object, escapes values automatically unless they are wrapped in `sql.raw()`.

Example:

```ts
const limit = 50
await database.query(sql`SELECT * FROM users LIMIT ${50}`)

// same as:
await database.query({ text: "SELECT * FROM users LIMIT $1", values: [limit])
```

### sql.raw()

Wrap your SQL template string values in this call to prevent escaping.

Example:

```ts
await database.query(sql`
  UPDATE users SET last_login = ${loggingIn ? "NOW()" : "NULL"} WHERE id = ${userID}
`)
```

### spreadAnd({ [columnName: string]: any })

Check for equivalence of multiple column's values at once. Handy to keep long WHERE expressions short and concise.

Example:

```ts
const users = await database.query(sql`
  SELECT * FROM users WHERE ${spreadAnd({ name: "John", birthday: "1990-09-10" })}
`)

// same as:
// sql`SELECT * FROM users WHERE name = 'John' AND birthday = '1990-09-10'`
```

### spreadInsert({ [columnName: string]: any })

Spread INSERT VALUES to keep the query sweet and short without losing explicity.

Example:

```ts
const users = await database.query(sql`
  INSERT INTO users ${spreadInsert({ name: "John", email: "john@example.com" })}
`)

// same as:
// sql`INSERT INTO users ("name", "email") VALUES ('John', 'john@example.com')`
```

### defineTable(tableName: string, schema: { [columnName: string]: Schema.\* })

Define a table's schema, so the queries can be validated at build time with `pg-lint`. When using TypeScript you can use `TableRow<typeof table>` and `NewTableRow<typeof table>` to derive TypeScript interfaces of your table records.

See [dist/schema.d.ts](./dist/schema.d.ts) for details.

### Schema

Example:

```ts
defineTable("users", {
  id: Schema.Number,
  email: Schema.String,
  email_confirmed: Schema.Boolean,
  profile: Schema.JSON,
  created_at: Schema.default(Schema.Date),
  updated_at: Schema.nullable(Schema.Date),
  roles: Schema.array(Schema.enum(["admin", "user"]))
})
```

See [dist/schema.d.ts](./dist/schema.d.ts) for details.

### TableRow<type> / NewTableRow<type> _(TypeScript only)_

Derive table record interfaces from the table schema. The type returned by `TableRow` is the kind of object a `SELECT *` will return, while `NewTableRow` returns an object that defines the shape of an object to be used for an `INSERT` with `spreadInsert()`.

The difference between the two is that `NewTableRow` marks properties referring to columns defined as `Schema.default()` or `Schema.nullable()` as optional.

Example:

```ts
const usersTable = defineTable("users", {
  id: Schema.Number,
  email: Schema.String
})

type UserRecord = TableRow<typeof usersTable>
type NewUserRecord = NewTableRow<typeof usersTable>
```

See [dist/schema.d.ts](./dist/schema.d.ts) for details.

## Performance

The performance impact of using the template string is neglectible. Benchmarked it once and it did 1000 queries in ~10ms on my MacBook Pro.

## Debugging

Set the environment variable `DEBUG` to `sqldb:*` to enable debug logging for this package.

## License

MIT
