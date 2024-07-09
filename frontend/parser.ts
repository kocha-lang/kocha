import {
  BinaryExpression,
  Expression,
  Identifier,
  NumericLiteral,
  Program,
  Statement,
} from "./ast.ts";
import { Token, tokenize, TokenType } from "./lexer.ts";

export default class Parser {
  private tokens: Token[] = [];
  private index: number = 0;

  private notEOF(): boolean {
    return this.tokens[this.index].type != TokenType.EOF;
  }

  private at(): Token {
    return this.tokens[this.index] as Token;
  }

  private next(): Token {
    this.index++;
    return this.tokens[this.index - 1];
  }

  private parseStatement(): Statement {
    return this.parseExpression();
  }

  // Orders Of Prescidence
  // AdditiveExpr
  // MultiplicitaveExpr
  // PrimaryExpr

  private parseExpression(): Expression {
    return this.parseAdditiveExpression();
  }

  private parseAdditiveExpression(): Expression {
    let left = this.parsePrimaryExpression();

    while (this.at().value == "+" || this.at().value == "-") {
      const operator = this.next().value;
      const right = this.parsePrimaryExpression();

      left = {
        kind: "BinaryExpression",
        left,
        right,
        operator,
      } as BinaryExpression;
    }

    return left;
  }

  private parsePrimaryExpression(): Expression {
    const tk = this.at().type;

    switch (tk) {
      case TokenType.Identifier:
        return {
          kind: "Identifier",
          symbol: this.next().value,
        } as Identifier;
      case TokenType.Number:
        return {
          kind: "NumericLiteral",
          value: parseFloat(this.next().value),
        } as NumericLiteral;
      default:
        console.error("Error occured in parsing a token ", this.at());
        Deno.exit(1);
    }
  }

  public createAST(srcCode: string): Program {
    this.tokens = tokenize(srcCode);

    const program: Program = {
      kind: "Program",
      body: [],
    };

    this.index = 0;

    // parse
    while (this.notEOF()) {
      program.body.push(this.parseStatement());
    }

    return program;
  }
}
