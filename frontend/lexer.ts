export enum TokenType {
  // literal types
  Number,
  Identifier,

  // grouping operators
  Equals,
  OpenParen,
  CloseParen,
  BinaryOperator,
  EOF, // tells the end of file

  // keywords
  Let,
}

export interface Token {
  value: string;
  type: TokenType;
}

const KEYWORDS: Record<string, TokenType> = {
  "xullas": TokenType.Let,
  "endi": TokenType.Equals,
};

export function token(value: string, type: TokenType): Token {
  return { value, type };
}

function isAlpha(src: string) {
  return /[a-zA-Z]/.test(src);
}

function isInt(src: string) {
  return /^-?\d+$/.test(src);
}

function isEscapeChar(src: string) {
  return /^[ \n\t]$/.test(src);
}

export function tokenize(srcCode: string): Token[] {
  const tokens = new Array<Token>();
  const src = srcCode.split("");
  let tempWord = "";

  for (let i = 0; i < src.length; i++) {
    if (src[i] == "(") {
      tokens.push(token(src[i], TokenType.OpenParen));
      continue;
    }
    if (src[i] == ")") {
      tokens.push(token(src[i], TokenType.CloseParen));
      continue;
    }
    if (["+", "-", "*", "/"].includes(src[i])) {
      tokens.push(token(src[i], TokenType.BinaryOperator));
      continue;
    }

    const saveInt = () => {
      tokens.push(token(tempWord, TokenType.Number));
    };

    const saveAlpha = () => {
      const reserved = KEYWORDS[tempWord];
      if (reserved) {
        tokens.push(token(tempWord, reserved));
      } else {
        tokens.push(token(tempWord, TokenType.Identifier));
      }
    };

    // multichar tokens
    if (isAlpha(src[i])) {
      tempWord += src[i];
      if (i + 1 == src.length) {
        saveAlpha();
      }
      continue;
    }

    if (isInt(src[i])) {
      tempWord += src[i];
      if (i + 1 == src.length) {
        saveInt();
      }
      continue;
    }

    // handling numeric saved word
    if (isInt(tempWord)) {
      saveInt();
    } // handling aphabetical saved word
    else if (isAlpha(tempWord)) {
      saveAlpha();
    } // handling escape characters word
    else if (!isEscapeChar(src[i])) {
      console.log("Unhandled character: ", src[i]);
      Deno.exit(1);
    }

    // clean the temp word
    tempWord = "";
  }

  tokens.push({ value: "EndOfFile", type: TokenType.EOF });
  return tokens;
}

// const code = await Deno.readTextFile("./test.kocha");
// for (const token of tokenize(code)) {
//   console.log(token);
// }

// console.log(tokenize("xullas a endi 10;"));
