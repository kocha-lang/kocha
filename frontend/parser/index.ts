import {
  AssignmentExpression,
  BinaryExpression,
  CallExpression,
  ElifStatement,
  ElseStatement,
  Expression,
  FunctionDeclaration,
  Identifier,
  IfStatement,
  MemberExpression,
  NumericLiteral,
  ObjectLiteral,
  Program,
  Property,
  ReturnStatement,
  Statement,
  StringLiteral,
  VariableDeclaration,
} from "./ast.ts";
import { tokenize } from "../lexer/index.ts";
import { Token, TokenType } from "../lexer/types.ts";

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

  private line(): number {
    return this.at().line;
  }

  private expect(type: TokenType, error: string): Token {
    this.index++;
    const prev = this.tokens[this.index - 1];
    if (!prev || prev.type != type) {
      console.error(
        `Parser error: ${error} ->
        ${prev} - 
        Expected: ${type}
        Line: ${this.line()}`,
      );
      Deno.exit(1);
    }
    return prev;
  }

  private panic(msg: string): never {
    throw `Parse Error: ${msg} Line: ${this.line()}`;
  }

  private parseStatement(): Statement {
    switch (this.at().type) {
      // variables
      case TokenType.Let:
      case TokenType.Const:
        return this.parseVarDeclaration();
      // functions
      case TokenType.Fn:
        return this.parseFnDeclaration();
      case TokenType.Return:
        return this.parseReturnStatement();
      // conditions
      case TokenType.If:
        return this.parseIfStatement();
      case TokenType.ElseIf:
        this.panic("Elif must have a parent IF stmt!");
        /* falls through */
      case TokenType.Else:
        this.panic("Else must have a parent IF stmt!");
        /* falls through */
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
      if (isConst) {
        this.panic("Const must contain a value fool!");
      }

      this.next();

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

  private parseFnDeclaration(): Statement {
    this.next(); // skipping fn keyword
    const name = this.expect(
      TokenType.Identifier,
      "Expceted function name following fn keyword",
    ).value; // looking for func name

    // parsing params | fn foo (a,b)
    const args = this.parseArgs();
    const params: string[] = [];

    for (const arg of args) {
      if (arg.kind !== "Identifier") {
        this.panic("Expected identifier on func declaration");
      }
      params.push((arg as Identifier).symbol);
    }

    // parsing body | fn foo (a,b) {}
    this.expect(TokenType.OpenBrace, "Expected '{' after function params");
    const body: Statement[] = [];

    while (
      this.at().type != TokenType.EOF && this.at().type != TokenType.CloseBrace
    ) {
      body.push(this.parseStatement());
    }

    this.expect(TokenType.CloseBrace, "Expected '}' after function body");
    const fn = {
      kind: "FunctionDeclaration",
      name,
      body,
      params,
    } as FunctionDeclaration;

    return fn;
  }

  private parseReturnStatement(): Statement {
    this.next();
    const value = this.parseExpression();
    this.expect(TokenType.Semicolon, "Expected semicolon after return");
    return { kind: "ReturnStatement", value } as ReturnStatement;
  }

  private parseIfStatement(): Statement {
    // if (a > 5 va b < 4) {}
    this.next(); // advance
    this.expect(TokenType.OpenParen, "Expected '(' after IF statement");
    const condition = this.parseLogicalExpression();
    this.expect(TokenType.CloseParen, "Expected ')' after IF statement");
    this.expect(TokenType.OpenBrace, "Expected '{' after IF statement");

    const body: Statement[] = [];
    while (
      this.at().type != TokenType.EOF && this.at().type != TokenType.CloseBrace
    ) {
      body.push(this.parseStatement());
    }

    this.expect(TokenType.CloseBrace, "Expected '}' after if body");

    // check for children
    const children: Statement[] = [];

    let counter = 0;
    const checkChildren = () => {
      if (this.at().type == TokenType.ElseIf) {
        children.push(this.parseElifStatement());
        checkChildren();
      } else if (this.at().type == TokenType.Else) {
        if (counter > 0) {
          this.panic("If can contain only one else statement");
        }
        children.push(this.parseElseStatement());
        counter++;
        checkChildren();
      }
    };
    // recursive check
    checkChildren();

    const ifStmt = {
      kind: "IfStatement",
      condition,
      body,
      children: children.length > 0 ? children : undefined,
    } as IfStatement;

    return ifStmt;
  }

  private parseElifStatement(): Statement {
    // elif (a > 5 va b < 4) {}
    this.next(); // advance
    this.expect(TokenType.OpenParen, "Expected '(' after elif statement");
    const condition = this.parseLogicalExpression();
    this.expect(TokenType.CloseParen, "Expected ')' after elif statement");
    this.expect(TokenType.OpenBrace, "Expected '{' after elif statement");

    const body: Statement[] = [];
    while (
      this.at().type != TokenType.EOF && this.at().type != TokenType.CloseBrace
    ) {
      body.push(this.parseStatement());
    }

    this.expect(TokenType.CloseBrace, "Expected '}' after if body");

    const elifStmt = {
      kind: "ElifStatement",
      condition,
      body,
    } as ElifStatement;

    return elifStmt;
  }

  private parseElseStatement(): Statement {
    // else {}
    this.next(); // advance
    this.expect(TokenType.OpenBrace, "Expected '{' after else statement");

    const body: Statement[] = [];
    while (
      this.at().type != TokenType.EOF && this.at().type != TokenType.CloseBrace
    ) {
      body.push(this.parseStatement());
    }

    this.expect(TokenType.CloseBrace, "Expected '}' after if body");

    const elseStmt = {
      kind: "ElseStatement",
      body,
    } as ElseStatement;

    return elseStmt;
  }

  // - Orders Of Prescidence -
  // Assignment
  // Object
  // Logical
  // Relational
  // AdditiveExpr
  // MultiplicitaveExpr
  // CallMember
  // Member
  // PrimaryExpr

  private parseExpression(): Expression {
    return this.parseAssignmentExpression();
  }

  private parseAssignmentExpression(): Expression {
    // syntax: var = expr();
    const left = this.parseObjectExpression();

    if (this.at().type == TokenType.Equals) {
      this.next();
      const value = this.parseAssignmentExpression();
      this.expect(
        TokenType.Semicolon,
        "Expected Semicolon after var assignment",
      );

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
      return this.parseLogicalExpression();
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
      props.push({ kind: "Property", key, value, line: this.line() });

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

  private parseLogicalExpression(): Expression {
    let left = this.parseRelationalExpression();

    while (["va", "yoki"].includes(this.at().value)) {
      const operator = this.next().value;
      const right = this.parseRelationalExpression();

      left = {
        kind: "BinaryExpression",
        left,
        right,
        operator,
      } as BinaryExpression;
    }

    return left;
  }

  private parseRelationalExpression(): Expression {
    let left = this.parseAdditiveExpression();

    while ([">", "<", "==", ">=", "<=", "!="].includes(this.at().value)) {
      const operator = this.next().value;
      const right = this.parseAdditiveExpression();

      left = {
        kind: "BinaryExpression",
        left,
        right,
        operator,
      } as BinaryExpression;
    }

    return left;
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
          this.panic("Nuxtadan keyin normalniy klichka berin");
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
      case TokenType.String:
        return {
          kind: "StringLiteral",
          value: this.next().value,
        } as StringLiteral;

      case TokenType.OpenParen: {
        this.next();
        const value = this.parseExpression();
        this.expect(TokenType.CloseParen, "Unexpected token inside skobki");
        return value;
      }

      case TokenType.BinaryOperator: {
        if (this.at().value == "-") {
          this.next();
          const num = this.expect(
            TokenType.Number,
            "Expected a number after a minus sign",
          ).value;

          return {
            kind: "NumericLiteral",
            value: (-1 * parseFloat(num)),
          } as NumericLiteral;
        }

        this.panic(`Error occured in parsing a token ${this.at()}`);
        break;
      }

      default:
        this.panic(`Error occured in parsing a token ${this.at()}`);
    }
  }

  public createAST(srcCode: string): Program {
    this.tokens = tokenize(srcCode);

    const program: Program = {
      kind: "Program",
      body: [],
      line: 0,
    };

    this.index = 0;

    // parse
    while (this.notEOF()) {
      const start = this.tokens[this.index].line;
      const stmt = this.parseStatement();

      stmt.line = start;
      program.body.push(stmt);
    }

    return program;
  }
}
