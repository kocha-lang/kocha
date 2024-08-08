import Parser from "./frontend/parser/index.ts";
import { createGlobalEnv } from "./runtime/environment/env.ts";
import { interpret } from "./runtime/interpreter.ts";

function repl() {
  const parser = new Parser();
  const env = createGlobalEnv();

  console.log("Kocha 1.0");
  while (true) {
    const input = prompt(">> ");

    if (!input || input.includes("exit")) {
      Deno.exit(1);
    }

    const program = parser.createAST(input);
    const result = interpret(program, env);
    console.log(result.value); // temp line
  }
}

async function runExample() {
  const parser = new Parser();
  const env = createGlobalEnv();

  const code = await Deno.readTextFile("./examples/test.kocha");
  const program = parser.createAST(code);
  interpret(program, env);
}

await runExample();
// repl();
