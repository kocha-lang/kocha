export type NodeType =
  // Statements
  | "Program"
  | "VariableDeclaration"
  // Expressions
  | "BinaryExpression"
  | "CallExpression"
  | "UnaryExpression"
  | "NumericLiteral"
  | "Identifier"
  | "FunctionDeclaration";

export interface Statement {
  kind: NodeType;
}

export interface Program extends Statement {
  kind: "Program";
  body: Statement[];
}

export interface VariableDeclaration extends Statement {
  kind: "VariableDeclaration";
  isConst: boolean;
  identifier: string;
  value?: Expression;
}

export interface Expression extends Statement {}

export interface BinaryExpression extends Expression {
  kind: "BinaryExpression";
  left: Expression;
  right: Expression;
  operator: string;
}

export interface Identifier extends Expression {
  kind: "Identifier";
  symbol: string;
}

export interface NumericLiteral extends Expression {
  kind: "NumericLiteral";
  value: number;
}
