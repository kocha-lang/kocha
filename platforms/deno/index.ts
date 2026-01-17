// PLATFORM: Deno CLI
import { repl } from "./repl.ts";
import { runCode } from "../shared/runner.ts";

async function runCodeFromFile(path: string) {
  const code = await Deno.readTextFile(path);
  runCode(code);
}

function main() {
  if (Deno.args.length == 0) {
    repl();
    return;
  }

  if (Deno.args.length == 1) {
    runCodeFromFile(Deno.args[0]);
  }
}

main();
