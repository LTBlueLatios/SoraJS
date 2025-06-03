export function generateWat(ast) {
    let output = "(module\n";
    const exportedFunctions = [];

    const jwasmToWatTypeMap = {
        Double: "f64",
        Int: "i32",
    };

    function getWatTypePrefix(dataType) {
        const watType = jwasmToWatTypeMap[dataType];
        if (!watType) {
            throw new Error(
                `Unsupported JWASM data type for WAT generation: ${dataType}`,
            );
        }
        return watType;
    }

    function generateStatementBlock(statements, indentLevel) {
        const indent = " ".repeat(indentLevel);
        return statements
            .map((stmt) => {
                return generate(stmt)
                    .split("\n")
                    .map((line) => `${indent}${line}`)
                    .join("\n");
            })
            .join("\n");
    }

    function generateProgram(node) {
        return node.body.map(generate).join("\n");
    }

    function generateFunctionDeclaration(node) {
        const funcName = node.name;
        const params = node.params
            .map((p) => `(param $${p.name} ${getWatTypePrefix(p.dataType)})`)
            .join(" ");
        const locals = node.locals
            .map((l) => `(local $${l.name} ${getWatTypePrefix(l.dataType)})`)
            .join("\n    ");
        const localsWat = locals ? `\n    ${locals}` : "";
        const result = `(result ${getWatTypePrefix(node.returnType)})`;
        const bodyWat = generateStatementBlock(node.body, 4);

        exportedFunctions.push(funcName);
        return `  (func $${funcName} ${params} ${result}${localsWat}\n${bodyWat}\n  )`;
    }

    function generateReturnStatement(node) {
        return generate(node.argument);
    }

    function generateExpressionStatement(node) {
        const expressionWat = generate(node.expression);
        if (node.expression.type === "AssignmentExpression") {
            return expressionWat;
        }

        // Do we need to drop the result of the expression?
        // If the expression is a function call or a variable access, we do not drop it.
        // if (node.expression.type === "CallExpression" || node.expression.type === "Identifier") {
        //    return `${expressionWat}`;
        // }
        //
        // If the expression is a literal or a binary expression, we drop it.
        // if (node.expression.type === "NumericLiteral" || node.expression.type === "BinaryExpression") {
        //      return `${expressionWat}\ndrop`;
        // }
        //
        // If the expression is a variable declaration, we do not drop it.
        // if (node.expression.type === "VariableDeclaration") {
        //      return `${expressionWat}`;
        // }
        return `${expressionWat}`;
    }

    function generateVariableDeclaration(node) {
        const initializerWat = generate(node.initializer);
        return `${initializerWat}\nlocal.set $${node.name}`;
    }

    function generateAssignmentExpression(node) {
        const rightWat = generate(node.right);
        return `${rightWat}\nlocal.set $${node.left.name}`;
    }

    function generateIfStatement(node) {
        const conditionWat = generate(node.condition);
        const consequentWat = generateStatementBlock(node.consequent, 6);

        let ifBlock = `${conditionWat}\n    (if\n      (then\n${consequentWat}\n      )`;

        if (node.alternate && node.alternate.length > 0) {
            const alternateWat = generateStatementBlock(node.alternate, 6);
            ifBlock += `\n      (else\n${alternateWat}\n      )`;
        }
        ifBlock += "\n    )";
        return ifBlock;
    }

    function generateBinaryExpression(node) {
        const leftWat = generate(node.left);
        const rightWat = generate(node.right);

        const operandTypePrefix = getWatTypePrefix(node.left.dataType);

        const opMap = {
            "+": `${operandTypePrefix}.add`,
            "-": `${operandTypePrefix}.sub`,
            "*": `${operandTypePrefix}.mul`,
            "/": `${operandTypePrefix}.div_s`,
            "==": `${operandTypePrefix}.eq`,
            "!=": `${operandTypePrefix}.ne`,
            "<": `${operandTypePrefix}.lt_s`,
            ">": `${operandTypePrefix}.gt_s`,
            "<=": `${operandTypePrefix}.le_s`,
            ">=": `${operandTypePrefix}.ge_s`,
        };

        if (node.left.dataType === "Double") {
            opMap["/"] = `${operandTypePrefix}.div`;
            opMap["<"] = `${operandTypePrefix}.lt`;
            opMap[">"] = `${operandTypePrefix}.gt`;
            opMap["<="] = `${operandTypePrefix}.le`;
            opMap[">="] = `${operandTypePrefix}.ge`;
        }

        const instruction = opMap[node.operator];
        if (!instruction) {
            throw new Error(
                `Unsupported operator '${node.operator}' for type '${node.left.dataType}'`,
            );
        }
        return `${leftWat}\n${rightWat}\n${instruction}`;
    }

    function generateNumericLiteral(node) {
        const typePrefix = getWatTypePrefix(node.dataType);
        return `${typePrefix}.const ${node.value}`;
    }

    function generateIdentifier(node) {
        return `local.get $${node.name}`;
    }

    function generateCallExpression(node) {
        const argsWat = node.args.map((arg) => generate(arg)).join("\n");
        return `${argsWat}\ncall $${node.callee}`;
    }

    function generateUnaryExpression(node) {
        const operandWat = generate(node.operand);

        if (node.operator === "-") {
            const typePrefix = getWatTypePrefix(node.dataType);
            if (node.dataType === "Double") {
                return `${typePrefix}.const 0.0\n${operandWat}\n${typePrefix}.sub`;
            } else {
                return `${typePrefix}.const 0\n${operandWat}\n${typePrefix}.sub`;
            }
        }

        throw new Error(`Unsupported unary operator: ${node.operator}`);
    }

    const nodeGenerators = {
        Program: generateProgram,
        FunctionDeclaration: generateFunctionDeclaration,
        ReturnStatement: generateReturnStatement,
        ExpressionStatement: generateExpressionStatement,
        VariableDeclaration: generateVariableDeclaration,
        AssignmentExpression: generateAssignmentExpression,
        IfStatement: generateIfStatement,
        BinaryExpression: generateBinaryExpression,
        UnaryExpression: generateUnaryExpression,
        NumericLiteral: generateNumericLiteral,
        Identifier: generateIdentifier,
        CallExpression: generateCallExpression,
    };

    function generate(node) {
        const generatorFn = nodeGenerators[node.type];
        if (!generatorFn) {
            throw new Error(
                `Unknown AST node type for generation: ${node.type}`,
            );
        }
        return generatorFn(node);
    }

    output += generate(ast);

    for (const funcName of exportedFunctions) {
        output += `\n  (export "${funcName}" (func $${funcName}))`;
    }

    output += "\n)";
    return output;
}
