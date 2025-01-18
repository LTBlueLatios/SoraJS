const TYPE_CONSTANTS = {
    STRING: "string",
    NUMBER: "number",
    BOOLEAN: "boolean",
    OBJECT: "object",
    FUNCTION: "function",
    UNDEFINED: "undefined",
    SYMBOL: "symbol",
    BIGINT: "bigint",
    NULL: "null",
    ANY: "any",
};

/**
 * Checks the parameters of a function. However you decide to use this is
 * only enforced by implicit rules, however it's best that you use this to
 * check only exposed functions and class methods.
 *
 * @param {*} params
 * @param {*} types
 */
function checkParams(params, types) {
    for (let i = 0; i < params.length; i++) {
        checkType(params[i], types[i]);
    }
}

/**
 * A function to check the type of a value to its intended type.
 * If a mismatch is found, then a verbose `TypeError` is thrown.
 *
 * @param {*} value
 * @param {*} type
 * @returns
 */
function checkType(value, type) {
    if (type === TYPE_CONSTANTS.ANY) return;

    const allowedTypes = Array.isArray(type) ? type : [type];

    if (value === undefined || value === null) {
        if (
            !allowedTypes.includes(TYPE_CONSTANTS.NULL) &&
            !allowedTypes.includes(TYPE_CONSTANTS.UNDEFINED)
        )
            throw new TypeError(
                `Expected ${allowedTypes.join(" or ")} but got ${value === null ? "null" : "undefined"
                } for ${value}`
            );
        else return;
    }

    let valid = false;
    for (const t of allowedTypes) {
        if (t === TYPE_CONSTANTS.NULL || t === TYPE_CONSTANTS.UNDEFINED) continue;
        if (typeof value === t) {
            valid = true;
            break;
        }
    }

    if (!valid) {
        throw new TypeError(
            `Expected ${allowedTypes.join(" or ")} but got ${typeof value} for ${value}`
        );
    }
}

export { checkParams, checkType, TYPE_CONSTANTS };