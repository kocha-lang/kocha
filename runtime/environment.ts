import { RuntimeValue } from "./values.ts";
import { MK_BOOL, MK_NULL } from "./values.ts";

function setupScope(env: Environment) {
  env.declareVariable("true", MK_BOOL(), true);
  env.declareVariable("false", MK_BOOL(false), true);
  env.declareVariable("pustoy", MK_NULL(), true);
}

export default class Environment {
  private parent?: Environment;
  private variables: Map<string, RuntimeValue>;
  private constants: Set<string>;

  constructor(parentEnv?: Environment) {
    const global = parentEnv ? true : false;
    this.parent = parentEnv;
    this.variables = new Map();
    this.constants = new Set();

    if (global) {
      setupScope(this);
    }
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
