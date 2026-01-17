import { Statement } from "../frontend/parser/ast.ts";
import Environment from "./environment/env.ts";

export type ValueType =
  | "null"
  | "string"
  | "number"
  | "boolean"
  | "object"
  | "native-fn"
  | "function"
  | "array"
  | "flow";

export interface RuntimeValue {
  type: ValueType;
  value: null | number | boolean | string; // temp line
}

export interface NullValue extends RuntimeValue {
  type: "null";
  value: null;
}

export interface NumberValue extends RuntimeValue {
  type: "number";
  value: number;
}

export interface StringValue extends RuntimeValue {
  type: "string";
  value: string;
}

export interface BoolValue extends RuntimeValue {
  type: "boolean";
  value: boolean;
}

// This is a runtime value that is used to communicate conditional statments with each other and control the flow
// Since the current implementation does not allow me to "throw" a value from deep children node to top parent ancestor directly
// So I have to just pass back the information that "hey we found an return / continue / break statement somewhere down below so don't execute other code"
// to all awaiting recursive calls.
// This is fine for a toy programming language but maybe some day i would rework it since it makes the cody harder to maintain.\
// Currently used in : if, if-else, else, while, function evaluations.
export interface FlowValue extends RuntimeValue {
  type: "flow";
  catched: boolean;
  skip: boolean;
  stop: boolean;
  returnValue?: RuntimeValue;
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

export function MK_STR(value: string) {
  return { type: "string", value } as StringValue;
}

/**
 * @param catched did it catch by children of if stmt or not
 * @param skip did it faced a continue stmt
 * @param stop did it faced a break stmt
 * @param returnValue value returned by return statement
 * @returns
 */
export function MK_FLOW(
  catched: boolean,
  skip: boolean,
  stop: boolean,
  returnValue?: RuntimeValue,
) {
  return { type: "flow", catched, skip, stop, returnValue } as FlowValue;
}

export interface ObjectValue extends RuntimeValue {
  type: "object";
  props: Map<string, RuntimeValue>;
}

export interface ArrayValue extends RuntimeValue {
  type: "array";
  values: RuntimeValue[];
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
