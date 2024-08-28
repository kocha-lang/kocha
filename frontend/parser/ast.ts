export type NodeType =
  // Statements
  | "Program"
  | "VariableDeclaration"
  | "FunctionDeclaration"
  | "ReturnStatement"
  | "IfStatement"
  | "ElifStatement"
  | "ElseStatement"
  // Expressions
  | "BinaryExpression"
  | "AssignmentExpression"
  | "MemberExpression"
  | "CallExpression"
  | "UnaryExpression" // not used yet
  // Literals
  | "Property"
  | "ObjectLiteral"
  | "NumericLiteral"
  | "Identifier"
  | "StringLiteral";

export interface Statement {
  kind: NodeType;
  line: number;
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

export interface FunctionDeclaration extends Statement {
  kind: "FunctionDeclaration";
  name: string;
  params: string[];
  body: Statement[];
}

export interface ReturnStatement extends Statement {
  kind: "ReturnStatement";
  value: Expression;
}

export interface IfStatement extends Statement {
  kind: "IfStatement";
  condition: BinaryExpression;
  body: Statement[];
  children?: Statement[];
}

export interface ElifStatement extends Statement {
  kind: "ElifStatement";
  condition: BinaryExpression;
  body: Statement[];
}

export interface ElseStatement extends Statement {
  kind: "ElseStatement";
  body: Statement[];
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

export interface MemberExpression extends Expression {
  kind: "MemberExpression";
  object: Expression;
  prop: Expression;
  computed: boolean;
}

export interface CallExpression extends Expression {
  kind: "CallExpression";
  args: Expression[];
  caller: Expression;
}

export interface Identifier extends Expression {
  kind: "Identifier";
  symbol: string;
}

export interface NumericLiteral extends Expression {
  kind: "NumericLiteral";
  value: number;
}

export interface StringLiteral extends Expression {
  kind: "StringLiteral";
  value: string;
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
