import { MK_NATIVE_FN, RuntimeValue } from "../values.ts";
import { gapir, kelishtir, korsat, shara, son } from "../std/functions.ts";
import { MK_BOOL, MK_NULL } from "../values.ts";
import panic from "../errors/panic.ts";

export function createGlobalEnv(): Environment {
  const env = new Environment();

  // std vars
  env.declareVariable("true", MK_BOOL(), true, -1);
  env.declareVariable("lagmon", MK_BOOL(false), true, -1);
  env.declareVariable("pustoy", MK_NULL(), true, -1);

  // std funcs
  // I/O
  env.declareVariable("korsat", MK_NATIVE_FN(korsat), true, -1); // print()
  env.declareVariable("gapir", MK_NATIVE_FN(gapir), true, -1); // input()
  // Math
  env.declareVariable("son", MK_NATIVE_FN(son), true, -1); // converts str to number
  env.declareVariable("shara", MK_NATIVE_FN(shara), true, -1); // random(min, max)
  env.declareVariable("kelishtir", MK_NATIVE_FN(kelishtir), true, -1); // round(n)

  return env;
}

export default class Environment {
  private parent?: Environment;
  private variables: Map<string, RuntimeValue>;
  private constants: Set<string>;

  constructor(parentEnv?: Environment) {
    this.parent = parentEnv;
    this.variables = new Map();
    this.constants = new Set();
  }

  public declareVariable(
    name: string,
    value: RuntimeValue,
    isConst: boolean,
    line: number,
  ) {
    if (this.variables.has(name)) {
      panic(
        `ENV: Varibale "${name}" already defined. Cannot declare twice`,
        line,
      );
    }

    if (isConst) {
      this.constants.add(name);
    }
    this.variables.set(name, value);
    return value;
  }

  private resolve(name: string, line: number): Environment {
    if (this.variables.has(name)) {
      return this;
    }

    if (this.parent == undefined) {
      panic(`ENV: Variable "${name}" is not declared. Cannot assign`, line);
    }

    // recursive call of a parent
    return this.parent.resolve(name, line);
  }

  public assignVariable(name: string, value: RuntimeValue, line: number) {
    const env = this.resolve(name, line);

    // cannot mutate
    if (env.constants.has(name)) {
      panic(`Const ${name} cannot be mutated`, line);
    }
    env.variables.set(name, value);
    return value;
  }

  public getVariable(name: string, line: number): RuntimeValue {
    const env = this.resolve(name, line);
    // never gonna be undefined thanks to resolve
    return env.variables.get(name) as RuntimeValue;
  }

  public updateVariable(
    name: string,
    updated: RuntimeValue,
    line: number,
  ): RuntimeValue {
    const env = this.resolve(name, line);
    env.variables.set(name, updated);

    return updated;
  }
}
