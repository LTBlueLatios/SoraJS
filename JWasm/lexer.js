import { createToken, Lexer } from "chevrotain";

const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: Lexer.SKIPPED,
});
const LineComment = createToken({
    name: "LineComment",
    pattern: /\/\/[^\n\r]*/,
    group: "comments",
});
const BlockComment = createToken({
    name: "BlockComment",
    pattern: /\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\//,
    group: "comments",
});

const Identifier = createToken({
    name: "IDENTIFIER",
    pattern: /[a-zA-Z_][a-zA-Z0-9_]*/,
});

const Function = createToken({
    name: "FUNCTION",
    pattern: /function/,
    longer_alt: Identifier,
});
const Return = createToken({
    name: "RETURN",
    pattern: /return/,
    longer_alt: Identifier,
});
const Let = createToken({
    name: "LET",
    pattern: /let/,
    longer_alt: Identifier,
});
const Const = createToken({
    name: "CONST",
    pattern: /const/,
    longer_alt: Identifier,
});
const If = createToken({ name: "IF", pattern: /if/, longer_alt: Identifier });
const Else = createToken({
    name: "ELSE",
    pattern: /else/,
    longer_alt: Identifier,
});

const TypeDouble = createToken({
    name: "TYPE_DOUBLE",
    pattern: /Double/,
    longer_alt: Identifier,
});
const TypeInt = createToken({
    name: "TYPE_INT",
    pattern: /Int/,
    longer_alt: Identifier,
});

const NumberLiteral = createToken({
    name: "NUMBER",
    pattern: /[0-9]+(\.[0-9]+)?/,
});
const StringLiteral = createToken({
    name: "STRING",
    pattern: /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/,
});

const LParen = createToken({ name: "LPAREN", pattern: /\(/ });
const RParen = createToken({ name: "RPAREN", pattern: /\)/ });
const LBrace = createToken({ name: "LBRACE", pattern: /\{/ });
const RBrace = createToken({ name: "RBRACE", pattern: /\}/ });
const Semicolon = createToken({ name: "SEMICOLON", pattern: /;/ });
const Comma = createToken({ name: "COMMA", pattern: /,/ });
const Colon = createToken({ name: "COLON", pattern: /:/ });

const LessThanEqual = createToken({
    name: "LESSTHANEQUAL",
    pattern: /<=/,
    longer_alt: Identifier,
});
const GreaterThanEqual = createToken({
    name: "GREATERTHANEQUAL",
    pattern: />=/,
    longer_alt: Identifier,
});
const Equality = createToken({
    name: "EQUALITY",
    pattern: /==/,
    longer_alt: Identifier,
});
const Inequality = createToken({
    name: "INEQUALITY",
    pattern: /!=/,
    longer_alt: Identifier,
});
const LessThan = createToken({
    name: "LESSTHAN",
    pattern: /</,
    longer_alt: Identifier,
});
const GreaterThan = createToken({
    name: "GREATERTHAN",
    pattern: />/,
    longer_alt: Identifier,
});

const Plus = createToken({ name: "PLUS", pattern: /\+/ });
const Minus = createToken({ name: "MINUS", pattern: /-/ });
const Multiply = createToken({ name: "MULTIPLY", pattern: /\*/ });
const Divide = createToken({ name: "DIVIDE", pattern: /\// });
const Assign = createToken({ name: "ASSIGN", pattern: /=/ });

const allTokens = [
    WhiteSpace,
    LineComment,
    BlockComment,
    Function,
    Return,
    Let,
    Const,
    If,
    Else,
    TypeDouble,
    TypeInt,
    LParen,
    RParen,
    LBrace,
    RBrace,
    Semicolon,
    Comma,
    Colon,
    LessThanEqual,
    GreaterThanEqual,
    Equality,
    Inequality,
    LessThan,
    GreaterThan,
    Plus,
    Minus,
    Multiply,
    Divide,
    Assign,
    NumberLiteral,
    StringLiteral,
    Identifier,
];

const JWasmLexer = new Lexer(allTokens);

export function tokenize(text) {
    const lexResult = JWasmLexer.tokenize(text);
    if (lexResult.errors.length > 0) {
        throw new Error(
            `Lexing errors detected: ${lexResult.errors
                .map(
                    (err) => `${err.message} at line ${err.line}:${err.column}`,
                )
                .join("\n")}`,
        );
    }
    return lexResult.tokens;
}

export const tokens = {
    Function,
    Return,
    Let,
    Const,
    If,
    Else,
    Identifier,
    NumberLiteral,
    StringLiteral,
    LParen,
    RParen,
    LBrace,
    RBrace,
    Semicolon,
    Comma,
    Colon,
    TypeDouble,
    TypeInt,
    Plus,
    Minus,
    Multiply,
    Divide,
    Assign,
    LessThan,
    GreaterThan,
    LessThanEqual,
    GreaterThanEqual,
    Equality,
    Inequality,
};
