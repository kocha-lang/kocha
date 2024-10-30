import Environment from "../environment/env.ts";
import { stdPanic } from "../errors/panic.ts";
import {
  type ArrayValue,
  MK_NUMBER,
  MK_STR,
  type NumberValue,
  RuntimeValue,
  StringValue,
} from "../values.ts";
import { MK_NULL } from "../values.ts";
import { ObjectValue } from "../values.ts";

export function korsat(args: RuntimeValue[], _env: Environment) {
  console.log(...args.map((arg) => {
    // validate
    if (arg == undefined) {
      return;
    }

    // handle array print
    if (arg.type == "array") {
      const temp: string[] = [];
      (arg as ArrayValue).values.forEach((el) => {
        temp.push((el.value ?? "null").toString());
      });
      return "[ " + temp.join(", ") + " ]";
    }

    // handle object print
    // shittiest code of my codebase :)
    if (arg.type == "object") {
      return [...(arg as ObjectValue).props.entries()].toString();
    }

    // primitive print
    return arg.value;
  }));

  return MK_NULL();
}

export function gapir(args: RuntimeValue[]): RuntimeValue {
  if (args.length < 2 && args[0].type == "string") {
    const text = args[0] as StringValue;

    const input = prompt(text.value);

    return MK_STR(input ?? "");
  }

  // todo: make proper error handling
  return MK_NULL();
}

export function son(args: RuntimeValue[]) {
  if (args.length < 2 && args[0].type == "string") {
    const num = Number(args[0].value);
    return MK_NUMBER(num);
  }

  // todo: make proper error handling
  return MK_NULL();
}

export function shara(args: RuntimeValue[]) {
  if (args.length != 2) {
    stdPanic(
      `Random function needs 2 arguments, but ${args.length} were passed`,
    );
  }

  if (args[0].type != "number" || args[1].type != "number") {
    stdPanic("Arguments for random function must be of a number type");
  }

  // at this point we know that we 2 args that are numbers
  const min = (args[0] as NumberValue).value;
  const max = (args[1] as NumberValue).value;

  return MK_NUMBER(Math.random() * (max - min) + min);
}

export function kelishtir(args: RuntimeValue[]) {
  if (args.length != 1) {
    stdPanic(
      `Round function needs 1 argument, but ${args.length} were passed`,
    );
  }

  if (args[0].type != "number") {
    stdPanic("Arguments for round function must be of a number type");
  }

  // bro really thinks he wrote a programming language
  // it is just a wrapper of js functions...
  return MK_NUMBER(Math.round((args[0] as NumberValue).value));
}
