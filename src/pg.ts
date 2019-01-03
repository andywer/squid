import * as pg from "pg"

export * from "./schema"

// Just pass through; the postgres query config format is our default data model
export * from "./sql"

declare module "pg" {
  interface TypedQueryResult<RowType = any> extends pg.QueryResult {
    rows: RowType[]
  }

  interface ClientBase {
    query<RowType = any>(queryConfig: pg.QueryConfig): Promise<TypedQueryResult<RowType>>
  }

  interface Pool {
    query<RowType = any>(queryConfig: pg.QueryConfig): Promise<TypedQueryResult<RowType>>
  }
}
