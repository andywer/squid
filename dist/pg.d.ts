import * as pg from "pg";
export * from "./schema";
export * from "./sql";
declare module "pg" {
    interface TypedQueryResult<RowType = any> extends pg.QueryResult {
        rows: RowType[];
    }
    interface ClientBase {
        query<RowType = any>(queryConfig: pg.QueryConfig): Promise<TypedQueryResult<RowType>>;
    }
    interface Pool {
        query<RowType = any>(queryConfig: pg.QueryConfig): Promise<TypedQueryResult<RowType>>;
    }
}
