import { PRIMITIVE_TYPE_CONSTANTS } from "./TypeConstants.js";

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
 * @private
 *
 * @param {*} value
 * @param {*} type
 * @returns
 */
function checkType(value, type) {
    if (type === PRIMITIVE_TYPE_CONSTANTS.ANY) return;

    const allowedTypes = Array.isArray(type) ? type : [type];

    if (value === undefined || value === null) {
        if (
            !allowedTypes.includes(PRIMITIVE_TYPE_CONSTANTS.NULL) &&
            !allowedTypes.includes(PRIMITIVE_TYPE_CONSTANTS.UNDEFINED)
        )
            throw new TypeError(
                `Expected ${allowedTypes.join(" or ")} but got ${value === null ? "null" : "undefined"
                } for ${value}`
            );
        else return;
    }

    let valid = false;
    for (const t of allowedTypes) {
        if (t === PRIMITIVE_TYPE_CONSTANTS.NULL || t === PRIMITIVE_TYPE_CONSTANTS.UNDEFINED) continue;
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

export { checkParams };