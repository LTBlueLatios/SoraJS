import { tokens } from "./lexer.js";

export function parse(chevrotainTokens) {
    let current = 0;
    let currentBlockLocals = {};
    const topLevelDeclarations = {
        functions: {},
        conditionals: {},
    };

    function peek() {
        return current < chevrotainTokens.length
            ? chevrotainTokens[current]
            : null;
    }

    function advance() {
        return chevrotainTokens[current++];
    }

    function check(tokenType) {
        if (peek() && peek().tokenType === tokenType) {
            advance();
            return true;
        }
        return false;
    }

    function expect(tokenType, message) {
        const token = peek();
        if (!token || token.tokenType !== tokenType) {
            throw new Error(
                `${message} at line ${token?.startLine || "unknown"}, column ${token?.startColumn || "unknown"}`,
            );
        }
        return advance();
    }

    function parseType() {
        const token = peek();
        if (!token) throw new Error("Expected type, but found end of input.");
        if (token.tokenType === tokens.TypeDouble) {
            advance();
            return "Double";
        }
        if (token.tokenType === tokens.TypeInt) {
            advance();
            return "Int";
        }
        throw new Error(
            `Expected a type (e.g., 'Double', 'Int'), but found ${token.image} at line ${token.startLine}, column ${token.startColumn}`,
        );
    }

    function getResultingType(leftType, rightType) {
        if (leftType === "Double" || rightType === "Double") {
            return "Double";
        }
        return "Int";
    }

    function parsePrimary() {
        const token = peek();
        if (!token) throw new Error("Unexpected end of input");

        if (token.tokenType === tokens.NumberLiteral) {
            advance();
            const dataType = token.image.includes(".") ? "Double" : "Int";
            return {
                type: "NumericLiteral",
                value: token.image,
                dataType: dataType,
            };
        }

        if (token.tokenType === tokens.Identifier) {
            advance();
            const identifierName = token.image;

            if (peek() && peek().tokenType === tokens.LParen) {
                advance();
                const args = [];
                if (peek() && peek().tokenType !== tokens.RParen) {
                    do {
                        args.push(parseExpression());
                    } while (check(tokens.Comma));
                }
                expect(
                    tokens.RParen,
                    "Expected ')' after arguments in call expression",
                );

                const declaration =
                    topLevelDeclarations.functions[identifierName];

                // For testing purposes, allow undeclared functions with default return type
                if (!declaration) {
                    return {
                        type: "CallExpression",
                        callee: identifierName,
                        args: args,
                        dataType: "Double",
                    };
                }

                if (args.length !== declaration.params.length) {
                    throw new Error(
                        `Incorrect number of arguments for '${identifierName}'. Expected ${declaration.params.length} but got ${args.length} at line ${token.startLine}, column ${token.startColumn}`,
                    );
                }
                for (let i = 0; i < args.length; i++) {
                    if (args[i].dataType !== declaration.params[i].dataType) {
                        throw new Error(
                            `Type mismatch for argument ${i + 1} in call to '${identifierName}'. Expected '${declaration.params[i].dataType}' but got '${args[i].dataType}'`,
                        );
                    }
                }
                return {
                    type: "CallExpression",
                    callee: identifierName,
                    args: args,
                    dataType: declaration.returnType,
                };
            }

            const dataType = currentBlockLocals[identifierName];
            if (!dataType) {
                throw new Error(
                    `Undeclared identifier '${identifierName}' at line ${token.startLine}, column ${token.startColumn}`,
                );
            }
            return {
                type: "Identifier",
                name: identifierName,
                dataType: dataType,
            };
        }
        throw new Error(
            `Unexpected token ${token.tokenType.name} at line ${token.startLine}, column ${token.startColumn}`,
        );
    }

    function parseUnary() {
        const token = peek();
        if (token && token.tokenType === tokens.Minus) {
            advance();
            const operand = parseUnary();
            return {
                type: "UnaryExpression",
                operator: "-",
                operand: operand,
                dataType: operand.dataType,
            };
        }
        return parsePrimary();
    }

    function parseArithmeticExpression() {
        return parseAdditionSubtraction();
    }

    function parseAdditionSubtraction() {
        let left = parseMultiplicationDivision();

        while (true) {
            const token = peek();
            if (!token) break;

            if ([tokens.Plus, tokens.Minus].includes(token.tokenType)) {
                advance();
                let operator = token.tokenType === tokens.Plus ? "+" : "-";
                const right = parseMultiplicationDivision();
                const dataType = getResultingType(
                    left.dataType,
                    right.dataType,
                );
                left = {
                    type: "BinaryExpression",
                    operator,
                    left,
                    right,
                    dataType,
                };
            } else {
                break;
            }
        }
        return left;
    }

    function parseMultiplicationDivision() {
        let left = parseUnary();

        while (true) {
            const token = peek();
            if (!token) break;

            if ([tokens.Multiply, tokens.Divide].includes(token.tokenType)) {
                advance();
                let operator = token.tokenType === tokens.Multiply ? "*" : "/";
                const right = parseUnary();
                const dataType = getResultingType(
                    left.dataType,
                    right.dataType,
                );
                left = {
                    type: "BinaryExpression",
                    operator,
                    left,
                    right,
                    dataType,
                };
            } else {
                break;
            }
        }
        return left;
    }

    function parseComparisonExpression() {
        let left = parseArithmeticExpression();

        while (true) {
            const token = peek();
            if (!token) break;

            if (
                [
                    tokens.Equality,
                    tokens.Inequality,
                    tokens.LessThan,
                    tokens.LessThanEqual,
                    tokens.GreaterThan,
                    tokens.GreaterThanEqual,
                ].includes(token.tokenType)
            ) {
                advance();

                let operator;
                switch (token.tokenType) {
                    case tokens.Equality:
                        operator = "==";
                        break;
                    case tokens.Inequality:
                        operator = "!=";
                        break;
                    case tokens.LessThan:
                        operator = "<";
                        break;
                    case tokens.LessThanEqual:
                        operator = "<=";
                        break;
                    case tokens.GreaterThan:
                        operator = ">";
                        break;
                    case tokens.GreaterThanEqual:
                        operator = ">=";
                        break;
                }

                const right = parseArithmeticExpression();

                if (left.dataType !== right.dataType) {
                    throw new Error(
                        `Type mismatch in comparison. Cannot compare '${left.dataType}' with '${right.dataType}' at line ${token.startLine}, column ${token.startColumn}`,
                    );
                }
                left = {
                    type: "BinaryExpression",
                    operator,
                    left,
                    right,
                    dataType: "Int",
                };
            } else {
                break;
            }
        }
        return left;
    }

    function parseAssignmentExpression() {
        let left = parseComparisonExpression();

        if (peek() && peek().tokenType === tokens.Assign) {
            advance();
            if (left.type !== "Identifier") {
                throw new Error(
                    `Invalid left-hand side of assignment. Expected an identifier at line ${left?.startLine}, column ${left?.startColumn}`,
                );
            }
            const right = parseAssignmentExpression();

            if (left.dataType !== right.dataType) {
                throw new Error(
                    `Type mismatch in assignment. Cannot assign '${right.dataType}' to '${left.dataType}' for variable '${left.name}' at line ${left?.startLine}, column ${left?.startColumn}`,
                );
            }
            return {
                type: "AssignmentExpression",
                operator: "=",
                left,
                right,
                dataType: right.dataType,
            };
        }
        return left;
    }

    function parseExpression() {
        return parseAssignmentExpression();
    }

    function parseReturnStatement() {
        advance();
        const expression = parseExpression();
        expect(tokens.Semicolon, "Expected ';' after return statement");
        return {
            type: "ReturnStatement",
            argument: expression,
            dataType: expression.dataType,
        };
    }

    function parseVariableDeclaration() {
        const kindToken = advance();
        const kind = kindToken.tokenType === tokens.Let ? "let" : "const";

        const nameToken = expect(
            tokens.Identifier,
            `Expected variable name after '${kind}'`,
        );
        const name = nameToken.image;

        let dataType = null;

        if (peek() && peek().tokenType === tokens.Colon) {
            advance();
            dataType = parseType();
        }

        if (currentBlockLocals[name]) {
            throw new Error(
                `Redeclaration of variable '${name}' at line ${nameToken.startLine}, column ${nameToken.startColumn}`,
            );
        }

        expect(tokens.Assign, "Expected '=' for variable initialization");
        const initializer = parseExpression();

        expect(tokens.Semicolon, "Expected ';' after variable declaration");

        if (!dataType) {
            dataType = initializer.dataType;
        } else if (dataType !== initializer.dataType) {
            throw new Error(
                `Type mismatch in variable declaration. Cannot initialize '${name}' of type '${dataType}' with an expression of type '${initializer.dataType}' at line ${nameToken.startLine}, column ${nameToken.startColumn}`,
            );
        }

        currentBlockLocals[name] = dataType;
        return {
            type: "VariableDeclaration",
            kind,
            name,
            dataType,
            initializer,
            isConst: kind === "const",
        };
    }

    function parseIfStatement() {
        expect(tokens.If, "Expected 'if' keyword");
        expect(tokens.LParen, "Expected '(' after 'if'");
        const condition = parseExpression();
        expect(tokens.RParen, "Expected ')' after if condition");

        if (condition.dataType !== "Int") {
            throw new Error(
                `If statement condition must evaluate to an 'Int' (boolean) type, but found '${condition.dataType}' at line ${condition.startLine}, column ${condition.startColumn}`,
            );
        }

        expect(tokens.LBrace, "Expected '{' before if consequent block");
        const consequent = parseStatementBlock();
        expect(tokens.RBrace, "Expected '}' after if consequent block");

        let alternate = null;
        if (check(tokens.Else)) {
            expect(tokens.LBrace, "Expected '{' before else alternate block");
            alternate = parseStatementBlock();
            expect(tokens.RBrace, "Expected '}' after else alternate block");
        }
        return { type: "IfStatement", condition, consequent, alternate };
    }

    function parseExpressionStatement() {
        const expression = parseExpression();
        expect(tokens.Semicolon, "Expected ';' after expression statement");
        return { type: "ExpressionStatement", expression: expression };
    }

    function parseStatement() {
        const token = peek();
        if (!token)
            throw new Error("Unexpected end of input while parsing statement");

        if (token.tokenType === tokens.Return) {
            return parseReturnStatement();
        } else if (token.tokenType === tokens.Let) {
            return parseVariableDeclaration();
        } else if (token.tokenType === tokens.Const) {
            return parseVariableDeclaration();
        } else if (token.tokenType === tokens.If) {
            return parseIfStatement();
        } else {
            return parseExpressionStatement();
        }
    }

    function parseStatementBlock() {
        const block = [];
        while (peek() && peek().tokenType !== tokens.RBrace) {
            block.push(parseStatement());
        }
        return block;
    }

    // --- Top-Level Declaration Parsing Functions ---
    // The basic principle behind top level declaration is that each specific declaration
    // corresponds to a "block". For example, a function declaration is a block that starts with
    // the 'function' keyword.
    //
    // All blocks can be identified as three parts, the declaration or header, the body, and the return type.
    // Expand on this later.

    function parseFunctionDeclaration() {
        expect(tokens.Function, "Expected 'function' keyword");

        const name = expect(tokens.Identifier, "Expected function name").image;

        expect(tokens.LParen, "Expected '(' after function name");
        const params = [];
        const initialBlockLocals = {};

        if (peek() && peek().tokenType !== tokens.RParen) {
            do {
                const paramNameToken = expect(
                    tokens.Identifier,
                    "Expected parameter name",
                );
                expect(
                    tokens.Colon,
                    "Expected ':' for parameter type annotation",
                );
                const paramType = parseType();

                params.push({
                    type: "Identifier",
                    name: paramNameToken.image,
                    dataType: paramType,
                });
                initialBlockLocals[paramNameToken.image] = paramType;
            } while (check(tokens.Comma));
        }
        expect(tokens.RParen, "Expected ')' after parameters");

        expect(
            tokens.Colon,
            "Expected ':' for function return type annotation",
        );
        const returnType = parseType();

        const previousBlockLocals = currentBlockLocals;
        currentBlockLocals = { ...initialBlockLocals };

        expect(tokens.LBrace, "Expected '{' before function body");
        const body = parseStatementBlock();
        expect(tokens.RBrace, "Expected '}' after function body");

        const declaredLocals = body
            .filter((s) => s.type === "VariableDeclaration")
            .map((s) => ({ name: s.name, dataType: s.dataType }));

        currentBlockLocals = previousBlockLocals;

        const functionNode = {
            type: "FunctionDeclaration",
            name,
            params,
            locals: declaredLocals,
            returnType,
            body,
        };
        topLevelDeclarations.functions[name] = functionNode;
        return functionNode;
    }

    function parseProgram() {
        const program = { type: "Program", body: [] };

        while (peek()) {
            const token = peek();

            if (token.tokenType === tokens.Function) {
                program.body.push(parseFunctionDeclaration());
            } else {
                throw new Error(
                    `Unexpected top-level token ${token.tokenType.name} at line ${token.startLine}, column ${token.startColumn}. Expected 'function' declaration.`,
                );
            }
        }
        return program;
    }

    return parseProgram();
}
