import { MK_NUMBER, RuntimeValue } from "./values.ts";
import {
  AssignmentExpression,
  BinaryExpression,
  CallExpression,
  FunctionDeclaration,
  Identifier,
  NumericLiteral,
  ObjectLiteral,
  Program,
  ReturnStatement,
  Statement,
  VariableDeclaration,
} from "../frontend/ast.ts";
import Environment from "./environment.ts";
import {
  evalAssignment,
  evalBinaryExpression,
  evalCallExpression,
  evalIdentifier,
  evalObjectExpression,
} from "./eval/expressions.ts";
import {
  evalFnDeclaration,
  evalProgram,
  evalReturnStatement,
  evalVarDeclaration,
} from "./eval/statements.ts";

export function interpret(astNode: Statement, env: Environment): RuntimeValue {
  switch (astNode.kind) {
    case "NumericLiteral":
      return MK_NUMBER((astNode as NumericLiteral).value);
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
    default:
      console.error(
        "Interpreter: AST type not handled yet type:",
        astNode,
      );
      Deno.exit(0);
  }
}
