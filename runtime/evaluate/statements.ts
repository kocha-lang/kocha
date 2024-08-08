import { FnValue, MK_NULL, RuntimeValue } from "../values.ts";
import {
  ElifStatement,
  ElseStatement,
  FunctionDeclaration,
  IfStatement,
  Program,
  ReturnStatement,
  VariableDeclaration,
} from "../../frontend/parser/ast.ts";
import Environment from "../environment/env.ts";
import { interpret } from "../interpreter.ts";
import { evalBinaryExpression } from "./expressions.ts";
import { BoolValue } from "../values.ts";
import { MK_BOOL } from "../values.ts";

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

  return env.declareVariable(declaration.name, fn, true);
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
): RuntimeValue {
  const scope = new Environment(env);
  const condition = evalBinaryExpression(statement.condition, env);

  // in case parent if statement must be called
  if (condition.value) {
    // execute line by line
    // can customize to handle break and continue keywords
    // or return a value from a statement but don't need it now
    for (const stmt of statement.body) {
      interpret(stmt, scope);
    }
    return MK_NULL();
  }

  if (statement.children) {
    for (const child of statement.children) {
      // run everychild till one of them will catch
      const result = interpret(child, env);
      if (result.value == true) {
        break;
      }
    }
  }

  return MK_NULL();
}

export function evalElifStatement(
  statement: ElifStatement,
  env: Environment,
): BoolValue {
  const scope = new Environment(env);
  const condition = evalBinaryExpression(statement.condition, env);

  if (condition.value) {
    // execute line by line
    // can customize to handle break and continue keywords
    // or return a value from a statement but don't need it now
    for (const stmt of statement.body) {
      interpret(stmt, scope);
    }
    return MK_BOOL(true);
  }

  return MK_BOOL(false);
}

export function evalElseStatement(statement: ElseStatement, env: Environment) {
  const scope = new Environment(env);

  for (const stmt of statement.body) {
    interpret(stmt, scope);
  }
  return MK_BOOL(true);
}
