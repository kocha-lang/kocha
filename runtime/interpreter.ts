import { MK_NULL, MK_NUMBER, NumberValue, RuntimeValue } from "./values.ts";
import {
  BinaryExpression,
  Identifier,
  NumericLiteral,
  Program,
  Statement,
} from "../frontend/ast.ts";
import Environment from "./environment.ts";

function evalProgram(program: Program, env: Environment): RuntimeValue {
  let lastInterpreted: RuntimeValue = MK_NULL();

  for (const statement of program.body) {
    lastInterpreted = interpret(statement, env);
  }

  return lastInterpreted;
}

function evalNumericBinaryExpression(
  left: NumberValue,
  right: NumberValue,
  operator: string,
): NumberValue {
  let result: number;

  switch (operator) {
    case "+":
      result = left.value + right.value;
      break;
    case "-":
      result = left.value - right.value;
      break;
    case "*":
      result = left.value * right.value;
      break;
    case "/":
      if (right.value == 0) {
        console.error("Cannot divide by zero!");
        Deno.exit(1);
      }
      result = left.value / right.value;
      break;
    default:
      result = left.value % right.value;
  }

  return { type: "number", value: result };
}

function evalBinaryExpression(
  binop: BinaryExpression,
  env: Environment,
): RuntimeValue {
  const left = interpret(binop.left, env);
  const right = interpret(binop.right, env);

  if (left.type == "number" && right.type == "number") {
    return evalNumericBinaryExpression(
      left as NumberValue,
      right as NumberValue,
      binop.operator,
    );
  }

  return MK_NULL();
}

function evalIdentifier(ident: Identifier, env: Environment): RuntimeValue {
  return env.getVariable(ident.symbol);
}

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

    default:
      console.error(
        "Interpreter: AST type not handled yet type:",
        astNode.kind,
      );
      Deno.exit(0);
  }
}
