import {
  ArrayValue,
  FnValue,
  MK_NULL,
  MK_NUMBER,
  MK_STR,
  NativeFnValue,
  NumberValue,
  ObjectValue,
  RuntimeValue,
} from "../values.ts";
import {
  type ArrayLiteral,
  AssignmentExpression,
  BinaryExpression,
  CallExpression,
  Identifier,
  MemberExpression,
  type NumericLiteral,
  ObjectLiteral,
  type StringLiteral,
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
  const varibale = env.getVariable(ident.symbol, ident.line);
  return varibale;
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

export function evalArrayExpression(
  arr: ArrayLiteral,
  env: Environment,
): RuntimeValue {
  const array = { type: "array", values: [] as RuntimeValue[] } as ArrayValue;

  for (const element of arr.values) {
    array.values.push(interpret(element, env));
  }

  return array;
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

  if (call.caller.kind == "MemberExpression") {
    const obj = (call.caller as MemberExpression).object as Identifier;
    const cur = env.getVariable(obj.symbol, call.line) as ArrayValue;
    if (fn.value == "push" && args.length == 1) {
      cur.values.push(args[0]);
      return env.updateVariable(obj.symbol, cur, call.line);
    } else if (fn.value == "pop" && args.length == 0) {
      cur.values.pop();
      return env.updateVariable(obj.symbol, cur, call.line);
    } else if (fn.value == "shift" && args.length == 0) {
      cur.values.shift();
      return env.updateVariable(obj.symbol, cur, call.line);
    } else if (fn.value == "clear" && args.length == 0) {
      cur.values = [];
      return env.updateVariable(obj.symbol, cur, call.line);
    } else if (fn.value == "getlength" && args.length == 0) {
      return MK_NUMBER(cur.values.length);
    }
  }

  panic(
    `${JSON.stringify(fn)} is not a function. So we can't call it!`,
    call.line,
  );
}

function makeKeysToCall(expr: MemberExpression, env: Environment): string[] {
  if (expr.object.kind == "MemberExpression") {
    const last = makeKeysToCall(expr.object as MemberExpression, env);

    if (expr.prop.kind == "Identifier") {
      last.push((expr.prop as Identifier).symbol);
    } else if (expr.prop.kind == "StringLiteral") {
      last.push((expr.prop as StringLiteral).value);
    }

    return last;
  }

  if (expr.object.kind == "Identifier") {
    const ident = expr.object as Identifier;
    const prop = expr.prop;

    if (prop.kind == "Identifier") {
      const val = env.getVariable((prop as Identifier).symbol, expr.line);

      if (val.type != "string") {
        panic("Only string computed is supported", expr.line);
      }

      return [ident.symbol, (val as StringValue).value];
    }

    return expr.prop.kind == "Identifier"
      ? [ident.symbol, (expr.prop as Identifier).symbol]
      : [ident.symbol, (expr.prop as StringLiteral).value];
  }

  panic(
    `Other kinds for objects are not supported yet\n Given: ${expr.object}`,
    expr.line,
  );
}

/**
 * It handles a lot of types of member expr syntax \
 * *~That's why it messy (pls fix that)*
 *
 * **Arrays**
 * - `a[0]` - get by index
 * - `a[i+x]` - binary expr as an index
 * - *todo: `a[x][b]` - multi dimensional array calls*
 *
 * **Objects**
 * - `b.x` - dot notation syntax
 * - `b.x.m.n` - nested call syntax
 * - `b["x"]` - computed syntax
 * - `b["x"]["m"]["n"]` - nested call computed syntax
 * ``
 */
export function evalMemberExpression(
  expr: MemberExpression,
  env: Environment,
): RuntimeValue {
  // todo: massive refactor needed. Messy and unreadable if stmts
  // this function must handle a lot of types of syntax
  // give array's elements
  if (expr.prop.kind == "NumericLiteral") {
    const arr = env.getVariable(
      (expr.object as Identifier).symbol,
      expr.line,
    ) as ArrayValue;

    // check if an object was here
    if (arr.values == undefined) {
      panic("This syntax is supported by arrays only", expr.line);
    }
    const index = expr.prop as NumericLiteral;

    if (index.value >= arr.values.length) {
      panic("Index out of bounds", expr.line);
    }

    return arr.values[index.value];
  } else if (
    expr.prop.kind == "Identifier" && expr.object.kind == "Identifier"
  ) {
    const symbol = (expr.prop as Identifier).symbol;

    if (symbol == "qosh") {
      return MK_STR("push");
    } else if (symbol == "chop") {
      return MK_STR("pop");
    } else if (symbol == "sur") {
      return MK_STR("shift");
    } else if (symbol == "yuqot") {
      return MK_STR("clear");
    } else if (symbol == "razmer") {
      return MK_STR("getlength");
    }
  }

  if (
    expr.prop.kind == "BinaryExpression" && expr.object.kind == "Identifier"
  ) {
    const binexpr = expr.prop as BinaryExpression;
    const index = evalBinaryExpression(binexpr, env) as NumberValue;

    const arr = env.getVariable(
      (expr.object as Identifier).symbol,
      expr.line,
    ) as ArrayValue;

    // check if an object was here
    if (arr.values == undefined) {
      panic("This syntax is supported by arrays only", expr.line);
    }

    if (index.value >= arr.values.length) {
      panic("Index out of bounds", expr.line);
    }

    return arr.values[index.value];
  }

  if (expr.computed && expr.prop.kind == "Identifier") {
    const symbol = (expr.object as Identifier).symbol;
    const index = env.getVariable(
      (expr.prop as Identifier).symbol,
      expr.line,
    ) as NumberValue;
    const arr = env.getVariable(
      symbol,
      expr.line,
    ) as ArrayValue;

    if (arr.values != undefined) {
      if (index.value >= arr.values.length) {
        panic("Index out of bounds", expr.line);
      }

      return arr.values[index.value];
    }
  }
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
