import Environment from "../environment.ts";
import { RuntimeValue } from "../values.ts";
import { MK_NULL } from "../values.ts";

export function korsat(args: RuntimeValue[], _env: Environment) {
  console.log(...args.map((arg) => arg.value));
  return MK_NULL();
}
