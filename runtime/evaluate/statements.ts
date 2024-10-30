import {
  type FlowValue,
  FnValue,
  MK_FLOW,
  MK_NULL,
  RuntimeValue,
} from "../values.ts";
import {
  ElifStatement,
  ElseStatement,
  FunctionDeclaration,
  IfStatement,
  Program,
  ReturnStatement,
  VariableDeclaration,
  type WhileStatement,
} from "../../frontend/parser/ast.ts";
import Environment from "../environment/env.ts";
import { interpret } from "../interpreter.ts";

export function evalProgram(program: Program, env: Environment): RuntimeValue {
  let lastInterpreted: RuntimeValue = MK_NULL();

  for (const statement of program.body) {
    lastInterpreted = interpret(statement, env);
  }

  return lastInterpreted;
}

export function evalVarDeclaration(
  declaration: VariableDeclaration,
  env: Environment,
): RuntimeValue {
  const value = declaration.value
    ? interpret(declaration.value, env)
    : MK_NULL();

  return env.declareVariable(
    declaration.identifier,
    value,
    declaration.isConst,
    declaration.line,
  );
}

export function evalFnDeclaration(
  declaration: FunctionDeclaration,
  env: Environment,
): RuntimeValue {
  const fn = {
    type: "function",
    name: declaration.name,
    params: declaration.params,
    declarationEnv: env,
    body: declaration.body,
  } as FnValue;

  return env.declareVariable(declaration.name, fn, true, declaration.line);
}

export function evalReturnStatement(
  statement: ReturnStatement,
  env: Environment,
): RuntimeValue {
  return interpret(statement.value, env);
}

export function evalIfStatement(
  statement: IfStatement,
  env: Environment,
): FlowValue {
  const scope = new Environment(env);
  const condition = interpret(statement.condition, env);
  // in case parent if statement must be called
  if (condition.value) {
    // execute line by line
    // can customize to handle break and continue keywords
    // or return a value from a statement but don't need it now
    for (const stmt of statement.body) {
      const val = interpret(stmt, scope);

      if (val.type == "flow") {
        const flow = val as FlowValue;

        if (flow.skip || flow.stop) {
          return MK_FLOW(true, flow.skip, flow.stop);
        }
      }
    }
    return MK_FLOW(true, false, false);
  }

  if (statement.children) {
    for (const child of statement.children) {
      // run everychild till one of them will catch
      const result = interpret(child, env);

      if (result.type == "flow") {
        const flow = result as FlowValue;

        if (flow.catched) {
          if (flow.skip || flow.stop) {
            return MK_FLOW(true, flow.skip, flow.stop);
          }
          break;
        }
      }
    }
  }

  return MK_FLOW(false, false, false);
}

export function evalElifStatement(
  statement: ElifStatement,
  env: Environment,
): FlowValue {
  const scope = new Environment(env);
  const condition = interpret(statement.condition, env);

  if (condition.value) {
    // execute line by line
    // can customize to handle break and continue keywords
    // or return a value from a statement but don't need it now
    for (const stmt of statement.body) {
      const val = interpret(stmt, scope);

      if (val.type == "flow") {
        const flow = val as FlowValue;

        if (flow.skip || flow.stop) {
          return MK_FLOW(true, flow.skip, flow.stop);
        }
      }
    }

    return MK_FLOW(true, false, false);
  }

  return MK_FLOW(false, false, false);
}

export function evalElseStatement(
  statement: ElseStatement,
  env: Environment,
): FlowValue {
  const scope = new Environment(env);

  for (const stmt of statement.body) {
    const val = interpret(stmt, scope);

    if (val.type == "flow") {
      const flow = val as FlowValue;

      if (flow.skip || flow.stop) {
        return MK_FLOW(true, flow.skip, flow.stop);
      }
    }
  }

  return MK_FLOW(true, false, false);
}

// bro thinks he wrote a programming language
// isn't it just a wrapper of js functions?
// bro write some llvm instad...

export function evalWhileStatement(
  statement: WhileStatement,
  env: Environment,
) {
  const scope = new Environment(env);

  while (interpret(statement.condition, env).value) {
    for (const stmt of statement.body) {
      const val = interpret(stmt, scope);

      if (val.type == "flow") {
        const flow = val as FlowValue;

        if (flow.skip) {
          break;
        } else if (flow.stop) {
          return MK_NULL();
        }
      }
    }
  }

  return MK_NULL();
}
