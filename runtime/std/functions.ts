import Environment from "../environment/env.ts";
import { MK_STR, RuntimeValue, StringValue } from "../values.ts";
import { MK_NULL } from "../values.ts";

export function korsat(args: RuntimeValue[], _env: Environment) {
  console.log(...args.map((arg) => arg.value));
  return MK_NULL();
}

export function gapir(args: RuntimeValue[]): RuntimeValue {
  if (args.length < 2 && args[0].type == "string") {
    const text = args[0] as StringValue;

    const input = prompt(text.value);

    return MK_STR(input ?? "");
  }

  return MK_NULL();
}
