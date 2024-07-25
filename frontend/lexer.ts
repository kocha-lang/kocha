export enum TokenType {
  // literal types
  Number,
  Identifier,

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
}

export interface Token {
  value: string;
  type: TokenType;
}

const KEYWORDS: Record<string, TokenType> = {
  "xullas": TokenType.Let,
  "jovob": TokenType.Const,
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
  return /^[ \n\t\r]$/.test(src);
}

export function tokenize(srcCode: string): Token[] {
  const tokens = new Array<Token>();
  const src = srcCode.split("");
  let tempWord = "";

  // =========== Methods ============
  // append whole int or alpha word to token functions
  const saveInt = () => {
    tokens.push(token(tempWord, TokenType.Number));
  };

  const saveAlpha = () => {
    const reserved = KEYWORDS[tempWord];
    if (typeof reserved == "number") {
      tokens.push(token(tempWord, reserved));
      return;
    }
    tokens.push(token(tempWord, TokenType.Identifier));
  };

  const finalHandle = (index: number) => {
    // handling numeric saved word
    if (isInt(tempWord)) {
      saveInt();
    } // handling aphabetical saved word
    else if (isAlpha(tempWord)) {
      saveAlpha();
    } // handling escape characters word
    else if (!isEscapeChar(src[index]) && tempWord) {
      console.log("Unhandled character:", src[index]);
      Deno.exit(1);
    }
    tempWord = "";
  };

  const findTheEnd = (i: number): number => {
    while (src[i] != "\n") {
      i++;
    }
    return i;
  };

  // =========== Loop ============
  for (let i = 0; i < src.length; i++) {
    // check if comment
    if (src[i] == "#") {
      i = findTheEnd(i);
      continue;
    }
    if (src[i] == "(") {
      finalHandle(i);
      tokens.push(token(src[i], TokenType.OpenParen));
      continue;
    }
    if (src[i] == ")") {
      finalHandle(i);
      tokens.push(token(src[i], TokenType.CloseParen));
      continue;
    }
    if (src[i] == "{") {
      finalHandle(i);
      tokens.push(token(src[i], TokenType.OpenBrace));
      continue;
    }
    if (src[i] == "}") {
      finalHandle(i);
      tokens.push(token(src[i], TokenType.CloseBrace));
      continue;
    }
    if (src[i] == "[") {
      finalHandle(i);
      tokens.push(token(src[i], TokenType.OpenBracket));
      continue;
    }
    if (src[i] == "]") {
      finalHandle(i);
      tokens.push(token(src[i], TokenType.CloseBracket));
      continue;
    }
    if (["+", "-", "*", "/", "%"].includes(src[i])) {
      finalHandle(i);
      tokens.push(token(src[i], TokenType.BinaryOperator));
      continue;
    }
    if (src[i] == ";") {
      finalHandle(i);
      tokens.push(token(src[i], TokenType.Semicolon));
      continue;
    }

    if (src[i] == ":") {
      finalHandle(i);
      tokens.push(token(src[i], TokenType.Colon));
      continue;
    }

    if (src[i] == ",") {
      finalHandle(i);
      tokens.push(token(src[i], TokenType.Comma));
      continue;
    }

    if (src[i] == ".") {
      finalHandle(i);
      tokens.push(token(src[i], TokenType.Dot));
      continue;
    }

    if (src[i] == "=") {
      finalHandle(i);
      tokens.push(token(src[i], TokenType.Equals));
      continue;
    }

    // if int or last
    if (isInt(src[i])) {
      tempWord += src[i];
      if (i + 1 == src.length) {
        saveInt();
      }
      continue;
    }

    // if alpha or last
    if (isAlpha(src[i])) {
      tempWord += src[i];
      if (i + 1 == src.length) {
        saveAlpha();
      }
      continue;
    }

    // clean the temp word
    finalHandle(i);
  }

  tokens.push({ value: "EndOfFile", type: TokenType.EOF });
  return tokens;
}

// const code = await Deno.readTextFile("./test.kocha");
// for (const token of tokenize(code)) {
//   console.log(token);
// }

// console.log(tokenize("xullas a endi (4 + 23)"));
