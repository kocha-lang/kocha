import Parser from "../../frontend/parser/index.ts";
import { createGlobalEnv } from "../../runtime/environment/env.ts";
import { VERSION } from "../shared/config.ts";
import { interpret } from "../../runtime/interpreter.ts";

export function repl() {
  const parser = new Parser();
  const env = createGlobalEnv();

  console.log(`Kocha ${VERSION} Repl`);
  console.log("exit - chiqish uchun");

  while (true) {
    const input = prompt(">> ");

    if (input?.trim() == "exit") {
      return;
    }

    if (!input) {
      continue;
    }

    try {
      const program = parser.createAST(input);
      const result = interpret(program, env);
      console.log(result.value);
    } catch (error) {
      console.log(error);
    }
  }
}
