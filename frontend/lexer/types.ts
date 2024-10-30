export enum TokenType {
  // literal types
  Number,
  Identifier,
  String,

  // grouping operators
  BinaryOperator,
  Equals,
  OpenParen, // (
  CloseParen, // )
  OpenBrace, // {
  CloseBrace, // }
  OpenBracket, // [
  CloseBracket, // ]
  Colon,
  Semicolon,
  Comma,
  Dot,
  EOF, // tells the end of file

  // keywords
  Let,
  Const,
  Fn,
  Return,
  If,
  ElseIf,
  Else,
  // conditions
  While,
  For,
  Continue,
  Break,
}

export interface Token {
  value: string;
  type: TokenType;
  line: number;
}

export const KEYWORDS: Record<string, TokenType> = {
  "xullas": TokenType.Let,
  "jovob": TokenType.Const,
  "endi": TokenType.Equals,
  "fn": TokenType.Fn,
  "qaytar": TokenType.Return,
  // conditions
  "agar": TokenType.If,
  "yemasa": TokenType.ElseIf,
  "oxiri": TokenType.Else,
  "va": TokenType.BinaryOperator,
  "yoki": TokenType.BinaryOperator,
  // loops
  "aylan": TokenType.While,
  "qarama": TokenType.Continue,
  "toxta": TokenType.Break,
};
