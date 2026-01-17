export function parserError(msg: string, line?: number): never {
  throw `Parser Error: ${msg} Line: ${line || "optional"}`;
}

export function lexerError(msg: string, line?: number): never {
  throw `Lexet Error: ${msg} Line: ${line || "optional"}`;
}
