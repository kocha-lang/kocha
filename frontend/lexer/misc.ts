import { Token, TokenType } from "./types.ts";

export function token(value: string, type: TokenType): Token {
  return { value, type };
}

export function isAlpha(src: string) {
  return /[a-zA-Z]/.test(src);
}

export function isInt(src: string) {
  return /^-?\d+$/.test(src);
}

export function isEscapeChar(src: string) {
  return /^[ \n\t\r]$/.test(src);
}
