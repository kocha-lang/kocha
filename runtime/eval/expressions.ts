import { MK_NULL, NumberValue, ObjectValue, RuntimeValue } from "../values.ts";
import {
  AssignmentExpression,
  BinaryExpression,
  Identifier,
  ObjectLiteral,
} from "../../frontend/ast.ts";
import Environment from "../environment.ts";
import { interpret } from "../interpreter.ts";

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

export function evalBinaryExpression(
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

export function evalIdentifier(
  ident: Identifier,
  env: Environment,
): RuntimeValue {
  return env.getVariable(ident.symbol);
}

export function evalAssignment(
  node: AssignmentExpression,
  env: Environment,
): RuntimeValue {
  // we only support identifier rn, maybe some support like a,b = b,a will be added in the future
  // would be awesome to implement a var switch using XOR gate

  if (node.owner.kind !== "Identifier") {
    throw "Interpretor: Cannot assign to anything rather than an identifier";
  }

  const varname = (node.owner as Identifier).symbol;
  return env.assignVariable(varname, interpret(node.value, env));
}

export function evalObjectExpression(
  obj: ObjectLiteral,
  env: Environment,
): RuntimeValue {
  const object = { type: "object", props: new Map() } as ObjectValue;

  for (const { key, value } of obj.props) {
    const runtimeVal = (value == undefined)
      ? env.getVariable(key)
      : interpret(value, env);

    object.props.set(key, runtimeVal);
  }

  return object;
}
