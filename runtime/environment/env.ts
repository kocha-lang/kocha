import { MK_NATIVE_FN, RuntimeValue } from "../values.ts";
import { korsat } from "../std/functions.ts";
import { MK_BOOL, MK_NULL } from "../values.ts";
import panic from "../errors/panic.ts";

export function createGlobalEnv(): Environment {
  const env = new Environment();

  // std vars
  env.declareVariable("true", MK_BOOL(), true, -1);
  env.declareVariable("false", MK_BOOL(false), true, -1);
  env.declareVariable("pustoy", MK_NULL(), true, -1);

  // std funcs
  env.declareVariable("korsat", MK_NATIVE_FN(korsat), true, -1);

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
}
