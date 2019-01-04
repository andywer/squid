export interface QueryConfig<RowType = any> {
    text: string;
    values: any[];
}
export interface SqlSpecialExpressionValue {
    type: symbol;
    buildFragment(nextParamID: number): QueryConfig<any>;
}
export declare const $sqlExpressionValue: unique symbol;
export declare const isSpecialExpression: (expression: any) => expression is SqlSpecialExpressionValue;
