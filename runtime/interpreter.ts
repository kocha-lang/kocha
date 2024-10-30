import { MK_FLOW, MK_NUMBER, MK_STR, RuntimeValue } from "./values.ts";
import {
  type ArrayLiteral,
  AssignmentExpression,
  BinaryExpression,
  CallExpression,
  ElifStatement,
  ElseStatement,
  FunctionDeclaration,
  Identifier,
  IfStatement,
  MemberExpression,
  NumericLiteral,
  ObjectLiteral,
  Program,
  ReturnStatement,
  Statement,
  StringLiteral,
  VariableDeclaration,
  type WhileStatement,
} from "../frontend/parser/ast.ts";
import Environment from "./environment/env.ts";
import {
  evalArrayExpression,
  evalAssignment,
  evalBinaryExpression,
  evalCallExpression,
  evalIdentifier,
  evalMemberExpression,
  evalObjectExpression,
} from "./evaluate/expressions.ts";
import {
  evalElifStatement,
  evalElseStatement,
  evalFnDeclaration,
  evalIfStatement,
  evalProgram,
  evalReturnStatement,
  evalVarDeclaration,
  evalWhileStatement,
} from "./evaluate/statements.ts";

export function interpret(astNode: Statement, env: Environment): RuntimeValue {
  switch (astNode.kind) {
    case "NumericLiteral":
      return MK_NUMBER((astNode as NumericLiteral).value);
    case "StringLiteral":
      return MK_STR((astNode as StringLiteral).value);
    case "Identifier":
      return evalIdentifier(astNode as Identifier, env);
    case "BinaryExpression":
      return evalBinaryExpression(astNode as BinaryExpression, env);
    case "Program":
      return evalProgram(astNode as Program, env);
    case "VariableDeclaration":
      return evalVarDeclaration(astNode as VariableDeclaration, env);
    case "FunctionDeclaration":
      return evalFnDeclaration(astNode as FunctionDeclaration, env);
    case "ReturnStatement":
      return evalReturnStatement(astNode as ReturnStatement, env);
    case "AssignmentExpression":
      return evalAssignment(astNode as AssignmentExpression, env);
    case "ObjectLiteral":
      return evalObjectExpression(astNode as ObjectLiteral, env);
    case "CallExpression":
      return evalCallExpression(astNode as CallExpression, env);
    case "MemberExpression":
      return evalMemberExpression(astNode as MemberExpression, env);
    case "IfStatement":
      return evalIfStatement(astNode as IfStatement, env);
    case "ElifStatement":
      return evalElifStatement(astNode as ElifStatement, env);
    case "ElseStatement":
      return evalElseStatement(astNode as ElseStatement, env);
    case "ArrayLiteral":
      return evalArrayExpression(astNode as ArrayLiteral, env);
    case "WhileStatement":
      return evalWhileStatement(astNode as WhileStatement, env);
    case "ContinueStatement":
      return MK_FLOW(false, true, false);
    case "BreakStatement":
      return MK_FLOW(false, false, true);
    default:
      console.error(
        "Interpreter: AST type not handled yet type:",
        astNode,
      );
      Deno.exit(0);
  }
}
