import { MK_NATIVE_FN, RuntimeValue } from "./values.ts";
import { korsat } from "./std/functions.ts";
import { MK_BOOL, MK_NULL } from "./values.ts";

export function createGlobalEnv(): Environment {
  const env = new Environment();

  // std vars
  env.declareVariable("true", MK_BOOL(), true);
  env.declareVariable("false", MK_BOOL(false), true);
  env.declareVariable("pustoy", MK_NULL(), true);

  // std funcs
  env.declareVariable("korsat", MK_NATIVE_FN(korsat), true);

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

  public declareVariable(name: string, value: RuntimeValue, isConst: boolean) {
    if (this.variables.has(name)) {
      throw `ENV: Varibale "${name}" already defined. Cannot declare twice`;
    }

    if (isConst) {
      this.constants.add(name);
    }
    this.variables.set(name, value);
    return value;
  }

  public resolve(name: string): Environment {
    if (this.variables.has(name)) {
      return this;
    }

    if (this.parent == undefined) {
      throw `ENV: Variable "${name}" is not declared. Cannot assign`;
    }

    // recursive call of a parent
    return this.parent.resolve(name);
  }

  public assignVariable(name: string, value: RuntimeValue) {
    const env = this.resolve(name);

    // cannot mutate
    if (env.constants.has(name)) {
      throw `Const ${name} cannot be mutated`;
    }
    env.variables.set(name, value);
    return value;
  }

  public getVariable(name: string): RuntimeValue {
    const env = this.resolve(name);
    // never gonna be undefined thanks to resolve
    return env.variables.get(name) as RuntimeValue;
  }
}
