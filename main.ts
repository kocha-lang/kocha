import Parser from "./frontend/parser.ts";
import { interpret } from "./runtime/interpreter.ts";

function repl() {
  const parser = new Parser();

  console.log("Kocha 1.0");

  while (true) {
    const input = prompt(">> ");

    if (!input || input.includes("exit")) {
      Deno.exit(1);
    }

    const program = parser.createAST(input);
    const result = interpret(program);
    console.log(result.value); // temp line
  }
}

repl();