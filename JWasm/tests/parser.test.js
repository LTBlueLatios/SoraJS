import { strict as assert } from "assert";
import { test, describe } from "node:test";
import { tokenize } from "../lexer.js";
import { parse } from "../parser.js";

describe("JWasm Parser Tests", () => {
    function parseCode(code) {
        const tokens = tokenize(code);
        return parse(tokens);
    }

    describe("Basic Function Declaration", () => {
        test("should parse simple function with no parameters", () => {
            const code = `
                function test(): Double {
                    2.0;
                }
            `;
            const ast = parseCode(code);
            assert.equal(ast.type, "Program");
            assert.equal(ast.body.length, 1);
            assert.equal(ast.body[0].type, "FunctionDeclaration");
            assert.equal(ast.body[0].name, "test");
            assert.equal(ast.body[0].params.length, 0);
            assert.equal(ast.body[0].returnType, "Double");
        });

        test("should parse function with parameters", () => {
            const code = `
                function add(a: Double, b: Double): Double {
                    a + b;
                }
            `;
            const ast = parseCode(code);
            const func = ast.body[0];
            assert.equal(func.params.length, 2);
            assert.equal(func.params[0].name, "a");
            assert.equal(func.params[0].dataType, "Double");
            assert.equal(func.params[1].name, "b");
            assert.equal(func.params[1].dataType, "Double");
        });

        test("should parse function with Int parameters", () => {
            const code = `
                function multiply(x: Int, y: Int): Int {
                    x * y;
                }
            `;
            const ast = parseCode(code);
            const func = ast.body[0];
            assert.equal(func.params[0].dataType, "Int");
            assert.equal(func.returnType, "Int");
        });
    });

    describe("Variable Declarations", () => {
        test("should parse let declaration with initialization", () => {
            const code = `
                function test(): Double {
                    let x = 5.0;
                    x;
                }
            `;
            const ast = parseCode(code);
            const func = ast.body[0];
            assert.equal(func.body.length, 2);
            assert.equal(func.body[0].type, "VariableDeclaration");
            assert.equal(func.body[0].name, "x");
            assert.equal(func.body[0].initializer.type, "NumericLiteral");
            assert.equal(func.body[0].initializer.value, "5.0");
        });

        test("should parse const declaration", () => {
            const code = `
                function test(): Double {
                    const PI = 3.14;
                    PI;
                }
            `;
            const ast = parseCode(code);
            const func = ast.body[0];
            assert.equal(func.body[0].type, "VariableDeclaration");
            assert.equal(func.body[0].name, "PI");
            assert.equal(func.body[0].isConst, true);
        });

        test("should parse let with type annotation", () => {
            const code = `
                function test(): Int {
                    let count: Int = 42;
                    count;
                }
            `;
            const ast = parseCode(code);
            const func = ast.body[0];
            const varDecl = func.body[0];
            assert.equal(varDecl.dataType, "Int");
            assert.equal(varDecl.initializer.dataType, "Int");
        });
    });

    describe("Expressions", () => {
        test("should parse numeric literals", () => {
            const code = `
                function test(): Double {
                    42.5;
                }
            `;
            const ast = parseCode(code);
            const func = ast.body[0];
            const expr = func.body[0].expression;
            assert.equal(expr.type, "NumericLiteral");
            assert.equal(expr.value, "42.5");
            assert.equal(expr.dataType, "Double");
        });

        test("should parse integer literals", () => {
            const code = `
                function test(): Int {
                    100;
                }
            `;
            const ast = parseCode(code);
            const func = ast.body[0];
            const expr = func.body[0].expression;
            assert.equal(expr.type, "NumericLiteral");
            assert.equal(expr.dataType, "Int");
        });

        test("should parse identifiers", () => {
            const code = `
                function test(x: Double): Double {
                    x;
                }
            `;
            const ast = parseCode(code);
            const func = ast.body[0];
            const expr = func.body[0].expression;
            assert.equal(expr.type, "Identifier");
            assert.equal(expr.name, "x");
        });

        test("should parse binary arithmetic expressions", () => {
            const code = `
                function test(): Double {
                    2.0 + 3.0;
                }
            `;
            const ast = parseCode(code);
            const func = ast.body[0];
            const expr = func.body[0].expression;
            assert.equal(expr.type, "BinaryExpression");
            assert.equal(expr.operator, "+");
            assert.equal(expr.left.value, "2.0");
            assert.equal(expr.right.value, "3.0");
        });

        test("should parse complex arithmetic expressions", () => {
            const code = `
                function test(): Double {
                    2.0 * 3.0 + 4.0;
                }
            `;
            const ast = parseCode(code);
            const func = ast.body[0];
            const expr = func.body[0].expression;
            assert.equal(expr.type, "BinaryExpression");
            assert.equal(expr.operator, "+");
            assert.equal(expr.left.type, "BinaryExpression");
            assert.equal(expr.left.operator, "*");
        });

        test("should parse comparison expressions", () => {
            const code = `
                function test(x: Double): Double {
                    x > 5.0;
                }
            `;
            const ast = parseCode(code);
            const func = ast.body[0];
            const expr = func.body[0].expression;
            assert.equal(expr.type, "BinaryExpression");
            assert.equal(expr.operator, ">");
        });
    });

    describe("Statements", () => {
        test("should parse return statements", () => {
            const code = `
                function test(): Double {
                    return 42.0;
                }
            `;
            const ast = parseCode(code);
            const func = ast.body[0];
            assert.equal(func.body.length, 1);
            assert.equal(func.body[0].type, "ReturnStatement");
            assert.equal(func.body[0].argument.value, "42.0");
        });

        test("should parse if statements", () => {
            const code = `
                function test(x: Double): Double {
                    if (x > 0.0) {
                        x;
                    }
                    x;
                }
            `;
            const ast = parseCode(code);
            const func = ast.body[0];
            assert.equal(func.body[0].type, "IfStatement");
            assert.equal(func.body[0].condition.operator, ">");
            assert.equal(func.body[0].consequent.length, 1);
        });

        test("should parse if-else statements", () => {
            const code = `
                function test(x: Double): Double {
                    if (x > 0.0) {
                        x;
                    } else {
                        0.0;
                    }
                }
            `;
            const ast = parseCode(code);
            const func = ast.body[0];
            const ifStmt = func.body[0];
            assert.equal(ifStmt.type, "IfStatement");
            assert.equal(ifStmt.alternate.length, 1);
        });

        test("should parse assignment expressions", () => {
            const code = `
                function test(): Double {
                    let x = 0.0;
                    x = 5.0;
                    x;
                }
            `;
            const ast = parseCode(code);
            const func = ast.body[0];
            assert.equal(func.body[1].type, "ExpressionStatement");
            assert.equal(func.body[1].expression.type, "AssignmentExpression");
            assert.equal(func.body[1].expression.left.name, "x");
            assert.equal(func.body[1].expression.right.value, "5.0");
        });
    });

    describe("Function Calls", () => {
        test("should parse function calls with no arguments", () => {
            const code = `
                function test(): Double {
                    helper();
                }
            `;
            const ast = parseCode(code);
            const func = ast.body[0];
            const expr = func.body[0].expression;
            assert.equal(expr.type, "CallExpression");
            assert.equal(expr.callee, "helper");
            assert.equal(expr.args.length, 0);
        });

        test("should parse function calls with arguments", () => {
            const code = `
                function test(): Double {
                    add(2.0, 3.0);
                }
            `;
            const ast = parseCode(code);
            const func = ast.body[0];
            const expr = func.body[0].expression;
            assert.equal(expr.type, "CallExpression");
            assert.equal(expr.callee, "add");
            assert.equal(expr.args.length, 2);
            assert.equal(expr.args[0].value, "2.0");
            assert.equal(expr.args[1].value, "3.0");
        });
    });

    describe("Complex Examples", () => {
        test("should parse kinetic energy function", () => {
            const code = `
                function kineticEnergy(mass: Double, velocity: Double): Double {
                    mass * velocity * velocity / 2.0;
                }
            `;
            const ast = parseCode(code);
            const func = ast.body[0];
            assert.equal(func.name, "kineticEnergy");
            assert.equal(func.params.length, 2);
            assert.equal(func.returnType, "Double");

            const expr = func.body[0].expression;
            assert.equal(expr.type, "BinaryExpression");
            assert.equal(expr.operator, "/");
        });

        test("should parse function with mixed statements", () => {
            const code = `
                function calculate(x: Double): Double {
                    let result = x * 2.0;
                    if (result > 10.0) {
                        result = result / 2.0;
                    }
                    return result;
                }
            `;
            const ast = parseCode(code);
            const func = ast.body[0];
            assert.equal(func.body.length, 3);
            assert.equal(func.body[0].type, "VariableDeclaration");
            assert.equal(func.body[1].type, "IfStatement");
            assert.equal(func.body[2].type, "ReturnStatement");
        });
    });

    describe("Error Cases", () => {
        test("should throw error for invalid syntax", () => {
            const code = `
                function test(): Double {
                    let x =;
                }
            `;
            assert.throws(() => parseCode(code));
        });

        test("should throw error for missing type annotation", () => {
            const code = `
                function test(x): Double {
                    x;
                }
            `;
            assert.throws(() => parseCode(code));
        });

        test("should throw error for unexpected tokens", () => {
            const code = `
                function test(): Double {
                    ++;
                }
            `;
            assert.throws(() => parseCode(code));
        });
    });
});
