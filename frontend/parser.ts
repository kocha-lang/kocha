import {
  AssignmentExpression,
  BinaryExpression,
  CallExpression,
  Expression,
  Identifier,
  MemberExpression,
  NumericLiteral,
  ObjectLiteral,
  Program,
  Property,
  Statement,
  VariableDeclaration,
} from "./ast.ts";
import { Token, tokenize, TokenType } from "./lexer.ts";

export default class Parser {
  private tokens: Token[] = [];
  private index: number = 0;

  private notEOF(): boolean {
    return this.tokens[this.index].type != TokenType.EOF;
  }

  /** Returns the current token */
  private at(): Token {
    return this.tokens[this.index] as Token;
  }

  private next(): Token {
    this.index++;
    return this.tokens[this.index - 1];
  }

  private expect(type: TokenType, error: string): Token {
    this.index++;
    const prev = this.tokens[this.index - 1];
    if (!prev || prev.type != type) {
      console.error(
        `Parser error:\n ${error}\n  -> ${prev} - Expected: ${type}`,
      );
      Deno.exit(1);
    }
    return prev;
  }

  private parseStatement(): Statement {
    switch (this.at().type) {
      case TokenType.Let:
      case TokenType.Const:
        return this.parseVarDeclaration();
      default:
        return this.parseExpression();
    }
  }

  /**
   *  Formats:
   *  1. (Let | Const) Identifier Equal Expression Semicolon
   *  ```
   *      xullas a endi 4;
   *      aniq a endi 4;
   *  ```
   *  2. Let Identifier Semicolon
   *    ```
   *        xullas a;
   *    ```
   */
  private parseVarDeclaration(): Statement {
    const isConst = this.next().type == TokenType.Const;
    const identifier = this.expect(
      TokenType.Identifier,
      "PARSER: Expected identifier after let | const",
    ).value;

    if (this.at().type == TokenType.Semicolon) {
      this.next();
      if (isConst) {
        throw "Const must contain a value fool!";
      }

      return {
        kind: "VariableDeclaration",
        identifier,
        isConst,
      } as VariableDeclaration;
    }

    this.expect(TokenType.Equals, "Expected equals token");
    const declaration = {
      kind: "VariableDeclaration",
      identifier,
      value: this.parseExpression(),
      isConst,
    } as VariableDeclaration;

    this.expect(TokenType.Semicolon, "Expected semicolon on var declr");
    return declaration;
  }

  // - Orders Of Prescidence -
  // AdditiveExpr
  // MultiplicitaveExpr
  // PrimaryExpr

  private parseExpression(): Expression {
    return this.parseAssignmentExpression();
  }

  private parseAssignmentExpression(): Expression {
    const left = this.parseObjectExpression();

    if (this.at().type == TokenType.Equals) {
      this.next();
      const value = this.parseAssignmentExpression();
      return {
        value,
        owner: left,
        kind: "AssignmentExpression",
      } as AssignmentExpression;
    }

    return left;
  }

  private parseObjectExpression(): Expression {
    if (this.at().type !== TokenType.OpenBrace) {
      return this.parseAdditiveExpression();
    }

    this.next();
    const props = new Array<Property>();

    while (this.notEOF() && this.at().type != TokenType.CloseBrace) {
      const key = this.expect(
        TokenType.Identifier,
        "Object literal key expected!",
      ).value;

      // shorthand for an empty value key { key, }
      if (this.at().type == TokenType.Comma) {
        this.next();
        props.push({ kind: "Property", key } as Property);
        continue;
      }

      // shorthand for { key }
      if (this.at().type == TokenType.CloseBrace) {
        props.push({ kind: "Property", key } as Property);
        continue;
      }

      // { key: value }
      this.expect(TokenType.Colon, "Missing colon after key");
      const value = this.parseExpression();
      props.push({ kind: "Property", key, value });

      if (this.at().type != TokenType.CloseBrace) {
        this.expect(
          TokenType.Comma,
          "Comma or closing brace expected on Object",
        );
      }
    }

    this.expect(TokenType.CloseBrace, "Object closing brace missing!");
    return { kind: "ObjectLiteral", props } as ObjectLiteral;
  }

  private parseAdditiveExpression(): Expression {
    let left = this.parseMultiplicativeExpression();

    while (this.at().value == "+" || this.at().value == "-") {
      const operator = this.next().value;
      const right = this.parseMultiplicativeExpression();

      left = {
        kind: "BinaryExpression",
        left,
        right,
        operator,
      } as BinaryExpression;
    }

    return left;
  }

  private parseMultiplicativeExpression(): Expression {
    let left = this.parseCallMemeberExpression();

    while (
      this.at().value == "*" || this.at().value == "/" || this.at().value == "%"
    ) {
      const operator = this.next().value;
      const right = this.parseCallMemeberExpression();

      left = {
        kind: "BinaryExpression",
        left,
        right,
        operator,
      } as BinaryExpression;
    }

    return left;
  }

  private parseCallMemeberExpression(): Expression {
    const member = this.parseMemberExpression();

    if (this.at().type == TokenType.OpenParen) {
      return this.parseCallExpression(member);
    }

    return member;
  }

  private parseCallExpression(caller: Expression): Expression {
    let callExpr: Expression = {
      kind: "CallExpression",
      caller,
      args: this.parseArgs(),
    } as CallExpression;

    // support for x()() syntax - calling a function that was returned
    if (this.at().type == TokenType.OpenParen) {
      callExpr = this.parseCallExpression(callExpr);
    }

    return callExpr;
  }

  private parseArgs(): Expression[] {
    this.expect(TokenType.OpenParen, "Exprected open paren");
    const args = this.at().type == TokenType.CloseParen
      ? []
      : this.parseArgList();

    this.expect(TokenType.CloseParen, "Exprected close paren");

    if (this.at().type == TokenType.Semicolon) {
      this.next();
    }

    return args;
  }

  private parseArgList(): Expression[] {
    const args = [this.parseAssignmentExpression()];

    while (this.at().type == TokenType.Comma && this.next()) {
      args.push(this.parseAssignmentExpression());
    }

    return args;
  }

  private parseMemberExpression(): Expression {
    let object = this.parsePrimaryExpression();

    while (
      this.at().type == TokenType.Dot || this.at().type == TokenType.OpenBracket
    ) {
      const operator = this.next();
      let prop: Expression;
      let computed: boolean;

      // syntax obj.expression
      if (operator.type == TokenType.Dot) {
        computed = false;
        prop = this.parsePrimaryExpression();

        if (prop.kind != "Identifier") {
          throw "Nuxtadan keyin normalniy klichka berin";
        }
      } // syntax: obj[computedValue]
      else {
        computed = true;
        prop = this.parseExpression();
        this.expect(
          TokenType.CloseBracket,
          "Missing close bracker after computed value",
        );
      }

      object = {
        kind: "MemberExpression",
        object,
        prop,
        computed,
      } as MemberExpression;
    }

    return object;
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

      case TokenType.OpenParen: {
        this.next();
        const value = this.parseExpression();
        this.expect(TokenType.CloseParen, "Unexpected token inside skobki");
        return value;
      }

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
