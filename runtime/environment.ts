import { RuntimeValue } from "./values.ts";

export default class Environment {
  private parent?: Environment;
  private variables: Map<string, RuntimeValue>;

  constructor(parentEnv?: Environment) {
    this.parent = parentEnv;
    this.variables = new Map();
  }

  public declareVariable(name: string, value: RuntimeValue) {
    if (this.variables.has(name)) {
      throw `ENV: Varibale "${name}" already defined. Cannot declare twice`;
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
    env.variables.set(name, value);
    return value;
  }

  public getVariable(name: string): RuntimeValue {
    const env = this.resolve(name);
    // never gonna be undefined thanks to resolve
    return env.variables.get(name) as RuntimeValue;
  }
}
