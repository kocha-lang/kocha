import { NullValue, NumberValue, RuntimeValue } from "./values.ts";
import {
  BinaryExpression,
  NumericLiteral,
  Program,
  Statement,
} from "../frontend/ast.ts";

function evalProgram(program: Program): RuntimeValue {
  let lastInterpreted: RuntimeValue = {
    type: "null",
    value: "null",
  } as NullValue;

  for (const statement of program.body) {
    lastInterpreted = interpret(statement);
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

function evalBinaryExpression(binop: BinaryExpression): RuntimeValue {
  const left = interpret(binop.left);
  const right = interpret(binop.right);

  if (left.type == "number" && left.type == "number") {
    return evalNumericBinaryExpression(
      left as NumberValue,
      right as NumberValue,
      binop.operator,
    );
  }

  return { value: "null", type: "null" } as NullValue;
}

export function interpret(astNode: Statement): RuntimeValue {
  switch (astNode.kind) {
    case "NumericLiteral":
      return {
        value: (astNode as NumericLiteral).value,
        type: "number",
      } as NumberValue;
    case "NullLiteral":
      return { value: "null", type: "null" } as NullValue;
    case "BinaryExpression":
      return evalBinaryExpression(astNode as BinaryExpression);
    case "Program":
      return evalProgram(astNode as Program);

    default:
      console.error(
        "Interpreter: AST type not handled yet type:",
        astNode.kind,
      );
      Deno.exit(0);
  }
}
