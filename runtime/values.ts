import { Statement } from "../frontend/ast.ts";
import Environment from "./environment.ts";

export type ValueType =
  | "null"
  | "number"
  | "boolean"
  | "object"
  | "native-fn"
  | "function";

export interface RuntimeValue {
  type: ValueType;
  value: null | number | boolean; // temp line
}

export interface NullValue extends RuntimeValue {
  type: "null";
  value: null;
}

export interface NumberValue extends RuntimeValue {
  type: "number";
  value: number;
}

export interface BoolValue extends RuntimeValue {
  type: "boolean";
  value: boolean;
}

export function MK_NUMBER(n: number) {
  return { type: "number", value: n } as NumberValue;
}

export function MK_NULL() {
  return { type: "null", value: null } as NullValue;
}

export function MK_BOOL(value = true) {
  return { type: "boolean", value: value } as BoolValue;
}

export interface ObjectValue extends RuntimeValue {
  type: "object";
  props: Map<string, RuntimeValue>;
}

export type FunctionCall = (
  args: RuntimeValue[],
  env: Environment,
) => RuntimeValue;

export interface NativeFnValue extends RuntimeValue {
  type: "native-fn";
  call: FunctionCall;
}

export function MK_NATIVE_FN(call: FunctionCall) {
  return { type: "native-fn", call } as NativeFnValue;
}

export interface FnValue extends RuntimeValue {
  type: "function";
  name: string;
  params: string[];
  declarationEnv: Environment;
  body: Statement[];
}
