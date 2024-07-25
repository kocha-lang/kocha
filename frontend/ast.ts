export type NodeType =
  // Statements
  | "Program"
  | "VariableDeclaration"
  | "FunctionDeclaration"
  // Expressions
  | "BinaryExpression"
  | "AssignmentExpression"
  | "CallExpression"
  | "UnaryExpression"
  // Literals
  | "Property"
  | "ObjectLiteral"
  | "NumericLiteral"
  | "Identifier";

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

export interface AssignmentExpression extends Expression {
  kind: "AssignmentExpression";
  owner: Expression;
  value: Expression;
}

export interface Identifier extends Expression {
  kind: "Identifier";
  symbol: string;
}

export interface NumericLiteral extends Expression {
  kind: "NumericLiteral";
  value: number;
}

export interface Property extends Expression {
  kind: "Property";
  key: string;
  value?: Expression;
}

export interface ObjectLiteral extends Expression {
  kind: "ObjectLiteral";
  props: Property[];
}
