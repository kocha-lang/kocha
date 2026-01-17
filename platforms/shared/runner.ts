import Parser from "../../frontend/parser/index.ts";
import { createGlobalEnv } from "../../runtime/environment/env.ts";
import { interpret } from "../../runtime/interpreter.ts";

export function runCode(code: string) {
  const parser = new Parser();
  const env = createGlobalEnv();

  const program = parser.createAST(code);
  interpret(program, env);
}
