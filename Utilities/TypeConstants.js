/**
 * @file TypeConstants.js
 * @module TypeConstants
 * @description Constants file for SoraJS type constants.
 * @abstract This is a general utility type constants file for SoraJS.
 * It is used to represent common type constants that are used throughout the library.
 */

const PRIMITIVE_TYPE_CONSTANTS = {
    STRING: "string",
    OBJECT: "object",
    FUNCTION: "function",
    ARRAY: "array",
    NUMBER: "number",
    BOOLEAN: "boolean",
    SYMBOL: "symbol",
    UNDEFINED: "undefined",
    NULL: "null",
};

const ARRAY_TYPE_CONSTANTS = {
    INT_8: "int8",
    INT_16: "int16",
    INT_32: "int32",
    INT_64: "int64",
    UINT_8: "uint8",
    UINT_16: "uint16",
    UINT_32: "uint32",
    UINT_64: "uint64",
    FLOAT_32: "float32",
    FLOAT_64: "float64",
};

export { PRIMITIVE_TYPE_CONSTANTS, ARRAY_TYPE_CONSTANTS };
