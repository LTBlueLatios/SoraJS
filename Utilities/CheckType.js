// who said I needed typescript?
// todo: replace with AltoMare extension

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

function checkParams(params, types) {
    for (let i = 0; i < params.length; i++) {
        checkType(params[i], types[i]);
    }
}

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