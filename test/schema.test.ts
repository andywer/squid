import test from "ava"
import { defineTable, Schema } from "../src/schema"

test("can define a schema", t => {
  t.notThrows(() =>
    defineTable("users", {
      id: Schema.Number,
      email: Schema.String,
      email_confirmed: Schema.Boolean,
      profile: Schema.JSON,
      created_at: Schema.Date,
      updated_at: Schema.nullable(Schema.Date),
      role: Schema.enum(["admin", "user"])
    })
  )
})
