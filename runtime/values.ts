export type ValueType = "null" | "number";

export interface RuntimeValue {
  type: ValueType;
  value: string | number; // temp line
}

export interface NullValue extends RuntimeValue {
  type: "null";
  value: "null";
}

export interface NumberValue extends RuntimeValue {
  type: "number";
  value: number;
}
