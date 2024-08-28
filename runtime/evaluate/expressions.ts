import {
  FnValue,
  MK_NULL,
  NativeFnValue,
  NumberValue,
  ObjectValue,
  RuntimeValue,
} from "../values.ts";
import {
  AssignmentExpression,
  BinaryExpression,
  CallExpression,
  Identifier,
  MemberExpression,
  ObjectLiteral,
} from "../../frontend/parser/ast.ts";
import Environment from "../environment/env.ts";
import { interpret } from "../interpreter.ts";
import { StringValue } from "../values.ts";
import { BoolValue } from "../values.ts";
import panic from "../errors/panic.ts";

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

function evalRelationalBinaryExpr(
  left: NumberValue | StringValue | BoolValue,
  right: NumberValue | StringValue | BoolValue,
  operator: string,
): RuntimeValue {
  let result: boolean;

  switch (operator) {
    case ">":
      result = left.value > right.value;
      break;
    case "<":
      result = left.value < right.value;
      break;
    case "==":
      result = left.value == right.value;
      break;
    case "!=":
      result = left.value != right.value;
      break;
    case ">=":
      result = left.value >= right.value;
      break;
    default:
      result = left.value <= right.value;
      break;
  }

  return { type: "boolean", value: result } as BoolValue;
}

function evalLogicalBinaryExpr(
  left: BoolValue,
  right: BoolValue,
  operator: string,
): BoolValue {
  let result: boolean;

  switch (operator) {
    case "va":
      result = left.value && right.value;
      break;
    default:
      result = left.value || right.value;
  }

  return { type: "boolean", value: result } as BoolValue;
}

export function evalBinaryExpression(
  binop: BinaryExpression,
  env: Environment,
): RuntimeValue {
  const left = interpret(binop.left, env);
  const right = interpret(binop.right, env);

  const bothNumbers = () => {
    return left.type == "number" && right.type == "number";
  };

  const bothStrings = () => {
    return left.type == "string" && right.type == "string";
  };

  const bothBools = () => {
    return left.type == "boolean" && right.type == "boolean";
  };

  // handling relational operators
  if ([">=", "<=", ">", "<", "==", "!="].includes(binop.operator)) {
    if (bothNumbers()) {
      return evalRelationalBinaryExpr(
        left as NumberValue,
        right as NumberValue,
        binop.operator,
      );
    }
    if (bothStrings()) {
      return evalRelationalBinaryExpr(
        left as StringValue,
        right as StringValue,
        binop.operator,
      );
    }
    panic(
      "Bir biriga tog'ri keladigan ishni qilin. Son bilan son, gap bilan gap solishtirin faqat",
      binop.line,
    );
  }

  if (binop.operator == "va" || binop.operator == "yoki") {
    if (bothBools()) {
      return evalLogicalBinaryExpr(
        left as BoolValue,
        right as BoolValue,
        binop.operator,
      );
    }
    panic("va/yoki faqat boolni orasida bo'lishi mumkin aka", binop.line);
  }

  // arithmetic operators
  if (bothNumbers()) {
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
  return env.getVariable(ident.symbol, ident.line);
}

export function evalAssignment(
  node: AssignmentExpression,
  env: Environment,
): RuntimeValue {
  // we only support identifier rn, maybe some support like a,b = b,a will be added in the future
  // would be awesome to implement a var switch using XOR gate

  if (node.owner.kind !== "Identifier") {
    panic("Cannot assign to anything rather than an identifier", node.line);
  }

  const varname = (node.owner as Identifier).symbol;
  return env.assignVariable(varname, interpret(node.value, env), node.line);
}

export function evalObjectExpression(
  obj: ObjectLiteral,
  env: Environment,
): RuntimeValue {
  const object = { type: "object", props: new Map() } as ObjectValue;

  for (const { key, value } of obj.props) {
    const runtimeVal = (value == undefined)
      ? env.getVariable(key, obj.line)
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
        scope.declareVariable(func.params[i], args[i], false, call.line);
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

    panic(
      `The number of args must match calling the function\n
           You gave ${args.length}\n
           Should be: ${func.params.length}`,
      call.line,
    );
  }

  panic(
    `${JSON.stringify(fn)} is not a function. So we can't call it!`,
    call.line,
  );
}

function makeKeysToCall(expr: MemberExpression, env: Environment): string[] {
  if (expr.object.kind == "MemberExpression") {
    const last = makeKeysToCall(expr.object as MemberExpression, env);
    const prop = expr.prop as Identifier;
    last.push(prop.symbol);
    return last;
  }

  if (expr.object.kind == "Identifier") {
    const ident = expr.object as Identifier;
    const prop = expr.prop as Identifier;

    return [ident.symbol, prop.symbol];
  }

  panic(
    `Other kinds for objects are not supported yet\n Given: ${expr.object}`,
    expr.line,
  );
}

export function evalMemberExpression(
  expr: MemberExpression,
  env: Environment,
): RuntimeValue {
  // it just finds an array of keys in the order where first element is a declared variable
  // and others are top -> bottom keys
  // for struct like a.x.y we will have an array of strings [a,x,y]
  const keys = makeKeysToCall(expr, env);
  let variable = env.getVariable(keys[0], expr.line) as ObjectValue;

  // emulate recursion with for loop
  for (let i = 1; i < keys.length; i++) {
    variable = variable.props.get(keys[i]) as ObjectValue;
  }

  return variable;
}
