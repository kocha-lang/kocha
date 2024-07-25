import { FnValue, MK_NULL, RuntimeValue } from "../values.ts";
import {
  FunctionDeclaration,
  Program,
  ReturnStatement,
  VariableDeclaration,
} from "../../frontend/ast.ts";
import Environment from "../environment.ts";
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
