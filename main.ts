import Parser from "./frontend/parser/index.ts";
import { createGlobalEnv } from "./runtime/environment/env.ts";
import { interpret } from "./runtime/interpreter.ts";

function repl() {
  const parser = new Parser();
  const env = createGlobalEnv();

  console.log("Kocha 1.1 Repl");
  console.log("exit - chiqish uchun");
  while (true) {
    const input = prompt(">> ");

    if (input?.trim() == "exit") {
      Deno.exit(1);
    }

    if (!input) {
      continue;
    }

    const program = parser.createAST(input);
    const result = interpret(program, env);
    console.log(result.value);
  }
}

async function runCode(path: string) {
  const parser = new Parser();
  const env = createGlobalEnv();

  const code = await Deno.readTextFile(path);
  const program = parser.createAST(code);
  interpret(program, env);
}

function main() {
  if (Deno.args.length == 0) {
    repl();
    return;
  }

  if (Deno.args.length == 1) {
    runCode(Deno.args[0]);
  }
}

main();
