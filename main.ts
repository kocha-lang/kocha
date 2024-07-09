import Parser from "./frontend/parser.ts";

function repl() {
  const parser = new Parser();

  console.log("Repl 1.0");

  while (true) {
    const input = prompt(">> ");

    if (!input || input.includes("exit")) {
      Deno.exit(1);
    }

    const program = parser.createAST(input);
    console.log(program);
  }
}

repl();
