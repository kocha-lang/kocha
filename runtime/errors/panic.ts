export default function panic(msg: string, line: number): never {
  throw `Interpretator Error: ${msg} Line: ${line}`;
}

export function stdPanic(msg: string): never {
  throw `Standard Lib Error: ${msg}`;
}
