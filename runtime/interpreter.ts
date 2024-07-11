import { MK_NUMBER, RuntimeValue } from "./values.ts";
import {
  BinaryExpression,
  Identifier,
  NumericLiteral,
  Program,
  Statement,
  VariableDeclaration,
} from "../frontend/ast.ts";
import Environment from "./environment.ts";
import { evalBinaryExpression, evalIdentifier } from "./eval/expressions.ts";
import { evalProgram, evalVarDeclaration } from "./eval/statements.ts";

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
    default:
      console.error(
        "Interpreter: AST type not handled yet type:",
        astNode,
      );
      Deno.exit(0);
  }
}
