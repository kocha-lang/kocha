import {
  FnValue,
  MK_NULL,
  NativeFnValue,
  NumberValue,
  ObjectValue,
  RuntimeValue,
  StringValue,
} from "../values.ts";
import {
  AssignmentExpression,
  BinaryExpression,
  CallExpression,
  Identifier,
  MemberExpression,
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

export function evalCallExpression(
  call: CallExpression,
  env: Environment,
): RuntimeValue {
  const args = call.args.map((arg) => interpret(arg, env));
  const fn = interpret(call.caller, env);

  if (fn.type == "native-fn") {
    const result = (fn as NativeFnValue).call(args, env);
    return result;
  }

  if (fn.type == "function") {
    const func = fn as FnValue;
    const scope = new Environment(func.declarationEnv);

    if (args.length == func.params.length) {
      // declare variables to the function's scope
      for (let i = 0; i < func.params.length; i++) {
        scope.declareVariable(func.params[i], args[i], false);
      }

      let result: RuntimeValue = MK_NULL();
      // execute line by line
      for (const statement of func.body) {
        if (statement.kind == "ReturnStatement") {
          result = interpret(statement, scope);
          return result;
        }
        result = interpret(statement, scope);
      }
      return result;
    }
    throw `The number of args must match calling the function\n
           You gave ${args.length}\n
           Should be: ${func.params.length}`;
  }
  throw `${JSON.stringify(fn)} is not a function. So we can't call it!`;
}

export function evalMemberExpression(
  expr: MemberExpression,
  env: Environment,
): RuntimeValue {
  const obj = interpret(expr.object, env) as
    | NumberValue
    | ObjectValue
    | StringValue;

  if (obj.type == "number" || obj.type == "string") {
    return obj;
  }

  let props;
  const givenProps = obj.props.get(
    (expr.prop as Identifier).symbol,
  ) as ObjectValue;

  if (givenProps) {
    props = givenProps.props;
  }

  const result = {
    type: "object",
    props: props,
  } as ObjectValue;

  if (obj.props.size == 1) {
    const value = result.props.values().next().value.value;

    return {
      type: "number",
      value: value,
    } as RuntimeValue;
  }

  return result;
}
