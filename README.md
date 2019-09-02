<h1 align="center">squid</h1>

<p align="center">
  <b>SQL tagged template strings and schema definitions for JavaScript & TypeScript 3.</b>
</p>

<p align="center">
  <a href="https://travis-ci.org/andywer/squid"><img alt="Build status" src="https://travis-ci.org/andywer/squid.svg?branch=master" /></a>
  <a href="https://www.npmjs.com/package/squid"><img alt="npm version" src="https://img.shields.io/npm/v/squid.svg" /></a>
</p>

<br />

The simple and safe way of writing SQL queries in node.js. Use [`postguard`](https://github.com/andywer/postguard) to validate SQL queries in your code against your table schemas at build time 🚀

&nbsp;&nbsp;&nbsp;&nbsp;👌&nbsp;&nbsp;Static typing made simple<br />
&nbsp;&nbsp;&nbsp;&nbsp;🛡&nbsp;&nbsp;SQL injection prevention<br />
&nbsp;&nbsp;&nbsp;&nbsp;🔦&nbsp;&nbsp;Static query validation using postguard<br />
&nbsp;&nbsp;&nbsp;&nbsp;⚡️&nbsp;&nbsp;Almost no performance overhead<br />

Parameters are SQL-injection-proofed by default. You can explicitly opt-out, by wrapping the parameter value in `sql.raw()`.

Supports only Postgres right now, but it is easy to add support for MySQL, SQLite, ... as well. Create an issue or pull request if you need support for another database.

## Why?

#### Why not use a query builder?

Query builders like [Prisma](https://www.prisma.io/) or [Knex.js](https://knexjs.org/) seem like a good choice, but they all have one issue in common: They provide an abstraction that maps 1:1 to SQL, making you create SQL queries without writing SQL, but using their proprietary API.

You don't just require developers to learn both, SQL and the query builder's API, but the additional abstraction layer is also an additional source of error.

#### Why not use an ORM?

ORMs like [Sequelize](http://docs.sequelizejs.com/) or [TypeORM](http://typeorm.io/) can get you started quickly, but will regularly lead to slow queries and can turn into a hassle in the long run. Read more about it [here](https://medium.com/ameykpatil/why-orm-shouldnt-be-your-best-bet-fffb66314b1b) and [here](https://blog.logrocket.com/why-you-should-avoid-orms-with-examples-in-node-js-e0baab73fa5), for instance.

## Installation

```sh
npm install squid
```

## Usage

### JavaScript

```js
import { defineTable, sql, spreadInsert } from "squid/pg"
import database from "./database"

// Feel free to put the table schema in a different file
defineTable("users", {
  id: Schema.Number,
  name: Schema.String
})

export async function queryUserById(id) {
  const { rows } = await database.query(sql`
    SELECT * FROM users WHERE id = ${id}
  `)
  return rows.length > 0 ? rows[0] : null
}
```

### TypeScript

```ts
// schema.ts
import { defineTable, Schema, NewTableRow, TableRow } from "squid"

export type NewUserRecord = NewTableRow<typeof usersTable>
export type UserRecord = TableRow<typeof usersTable>

const usersTable = defineTable("users", {
  id: Schema.Number,
  name: Schema.String
})
```

```ts
// users.ts
import { sql, spreadInsert } from "squid/pg"
import database from "./database"
import { NewUserRecord, UserRecord } from "./schema"

export async function createUser(record: NewUserRecord): Promise<UserRecord> {
  const { rows } = await database.query<UserRecord>(sql`
    INSERT INTO users ${spreadInsert(record)} RETURNING *
  `)
  return rows[0]
}

export async function queryUserById(id: string): Promise<UserRecord | null> {
  const { rows } = await database.query<UserRecord>(sql`
    SELECT * FROM users WHERE id = ${id}
  `)
  return rows[0] || null
}
```

We extend the `pg` driver's `query()` method types transparently, so you can pass a generic type parameter specifying the type of the result rows as you can see in the sample above.

The `query()` type parameter defaults to `any`, so you don't have to specify it. If it's set, the type of the `rows` result property will be inferred accordingly.

## Query values

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

## Tag function

The `sql` template tag creates query objects compatible with [`pg`](https://node-postgres.com), the super popular Postgres driver for node.

```js
import { sql, spreadInsert } from "squid/pg"

sql`INSERT INTO users ${spreadInsert({ name: "Andy", age: 29 })}`
// => { text: "INSERT INTO users ("name", "age") VALUES ($1, $2)",
//      values: [ "Andy", 29 ] }

sql`SELECT * FROM users WHERE age < ${maxAge}`
// => { text: "SELECT * FROM users WHERE age < $1",
//      values: [ maxAge ] }
```

## Import

All schema-related exports are database-driver-agnostic, so they can be imported from the main entrypoint `squid`:

```ts
import { defineTable, Schema, NewTableRow, TableRow } from "squid"
```

Non-schema-related exports are exported by the database-specific submodule `squid/pg`:

```ts
import { sql, spreadInsert } from "squid/pg"
```

For convenience `squid/pg` also exposes all the database-agnostic schema exports, so you can have one import declaration for everything:

```ts
import { defineTable, sql, spreadInsert, Schema, NewTableRow, TableRow } from "squid"
```

## SQL injections

All values passed into the tagged template string are automatically escaped to prevent SQL injections. You have to explicitly opt-out of this behavior by using `sql.raw()` in case you want to dynamically modify the query.

The only attack vector left is forgetting to use the `sql` template tag. To rule out this potential source of error, there is also a way to explicitly escape a value passed to the template string: `sql.safe()`.

An untagged template string using a value wrapped in `sql.safe()` will then result in an invalid query.

```js
// This is fine
await database.query(sql`SELECT * FROM users LIMIT ${limit}`)

// Results in the same query as the previous example
await database.query(sql`SELECT * FROM users LIMIT ${sql.safe(limit)}`)

// Forgot the tag - SQL injection possible!
await database.query(`SELECT * FROM users LIMIT ${limit}`)

// Forgot the tag - This line will now throw, no SQLi possible
await database.query(`SELECT * FROM users LIMIT ${sql.safe(limit)}`)
```

## API

### sql\`...\`

Turns a template string into a postgres query object, escapes values automatically unless they are wrapped in `sql.raw()`.

Example:

```js
const limit = 50
await database.query(sql`SELECT * FROM users LIMIT ${50}`)

// same as:
await database.query({ text: "SELECT * FROM users LIMIT $1", values: [limit])
```

### sql.raw(expression)

Wrap your SQL template string values in this call to prevent escaping.
Be careful, though. This is essentially an SQL injection prevention opt-out.

Example:

```js
await database.query(sql`
  UPDATE users SET last_login = ${loggingIn ? "NOW()" : "NULL"} WHERE id = ${userID}
`)
```

### sql.safe(value)

Wraps a value in an object that just returns the (escaped) value.

Use it if you want to make sure that a query lacking the `sql` template tag cannot be executed. Otherwise a missing template string tag might lead to SQL injections.

### spreadAnd({ [columnName: string]: any })

Check for equivalence of multiple column's values at once. Handy to keep long WHERE expressions short and concise.

Example:

```js
const users = await database.query(sql`
  SELECT * FROM users WHERE ${spreadAnd({ name: "John", birthday: "1990-09-10" })}
`)

// same as:
// sql`SELECT * FROM users WHERE name = 'John' AND birthday = '1990-09-10'`
```

### spreadInsert({ [columnName: string]: any })

Spread INSERT VALUES to keep the query sweet and short without losing explicity.

Example:

```js
const users = await database.query(sql`
  INSERT INTO users ${spreadInsert({ name: "John", email: "john@example.com" })}
`)

// same as:
// sql`INSERT INTO users ("name", "email") VALUES ('John', 'john@example.com')`
```

```js
const users = await database.query(sql`
  INSERT INTO users ${spreadInsert(
    { name: "John", email: "john@example.com" },
    { name: "Travis", email: "travis@example.com" }
  )}
`)

// same as:
// sql`INSERT INTO users ("name", "email") VALUES ('John', 'john@example.com'), ('Travis', 'travis@example.com')`
```

### spreadUpdate({ [columnName: string]: any })

Spread INSERT VALUES to keep the query sweet and short without losing explicity.

Example:

```js
await database.query(sql`
  UPDATE users
  SET ${spreadUpdate({ name: "John", email: "john@example.com" })}
  WHERE id = 1
`)

// same as:
// sql`UPDATE users SET "name" = 'John', "email" = 'john@example.com' WHERE id = 1`
```

### defineTable(tableName: string, schema: { [columnName: string]: Schema.\* })

Define a table's schema, so the queries can be validated at build time with `postguard`. When using TypeScript you can use `TableRow<typeof table>` and `NewTableRow<typeof table>` to derive TypeScript interfaces of your table records.

See [dist/schema.d.ts](./dist/schema.d.ts) for details.

### Schema

Example:

```js
defineTable("users", {
  id: Schema.Number,
  email: Schema.String,
  email_confirmed: Schema.Boolean,
  profile: Schema.JSON(
    Schema.Object({
      avatar_url: Schema.String,
      weblink: Schema.nullable(Schema.String)
    })
  ),
  created_at: Schema.default(Schema.Date),
  updated_at: Schema.nullable(Schema.Date),
  roles: Schema.Array(Schema.Enum(["admin", "user"]))
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

Set the environment variable `DEBUG` to `squid:*` to enable debug logging for this package.

## License

MIT
