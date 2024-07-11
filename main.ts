import Parser from "./frontend/parser.ts";
import Environment from "./runtime/environment.ts";
import { interpret } from "./runtime/interpreter.ts";
import { MK_BOOL, MK_NULL, MK_NUMBER } from "./runtime/values.ts";

function repl() {
  const parser = new Parser();
  const env = new Environment();
  // global vars
  env.declareVariable("x", MK_NUMBER(46), false);
  env.declareVariable("true", MK_BOOL(), true);
  env.declareVariable("false", MK_BOOL(false), true);
  env.declareVariable("pustoy", MK_NULL(), true);

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
  const env = new Environment();

  const code = await Deno.readTextFile("./examples/test.kocha");
  const program = parser.createAST(code);
  const result = interpret(program, env);
  console.log(result.value);
}

repl();
runExample();
