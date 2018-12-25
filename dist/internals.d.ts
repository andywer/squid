export interface QueryConfig {
    text: string;
    values: any[];
}
export interface SqlSpecialExpressionValue {
    type: symbol;
    buildFragment(nextParamID: number): QueryConfig;
}
export declare const $sqlExpressionValue: unique symbol;
export declare const isSpecialExpression: (expression: any) => expression is SqlSpecialExpressionValue;
