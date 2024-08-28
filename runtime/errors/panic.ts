export default function panic(msg: string, line: number): never {
  throw `Interpretator Error: ${msg} Line: ${line}`;
}
