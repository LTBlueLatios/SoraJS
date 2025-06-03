// This functionality is currently going under the process of recoding.
// Will probably be merged within a future AltoMare release as an in-built module.
// It is disabled currently due to performance issues and inability to handle
// JS quirks like Arrays being objects. It also is not extensible and can't
// handle custom types like checking for TypedArrays.
//
// RIP structs won't have type checks for now. How dangerous.

// import { PRIMITIVE_TYPE_CONSTANTS } from "./TypeConstants.js";

// /**
//  * A dynamic runtime type checker. Best used for dynamic
//  * API functions or methods that can't be covered by static checks.
//  *
//  * @param {Object} params - An array of values to be checked.
//  * @param {Array} types - An array of types to be checked against.
//  */
// function checkParams(params, types) {
//     for (let i = 0; i < params.length; i++) {
//         checkType(params[i], types[i]);
//     }
// }

// /**
//  * A function to check the type of a value to its intended type.
//  * If a mismatch is found, then a verbose `TypeError` is thrown.
//  * @private
//  *
//  * @param {*} value - The value to be checked.
//  * @param {*} type - The type to be checked against.
//  * @returns
//  */
// function checkType(value, type) {
//     if (type === PRIMITIVE_TYPE_CONSTANTS.ANY) return;

//     const allowedTypes = Array.isArray(type) ? type : [type];

//     if (value === undefined || value === null) {
//         if (
//             !allowedTypes.includes(PRIMITIVE_TYPE_CONSTANTS.NULL) &&
//             !allowedTypes.includes(PRIMITIVE_TYPE_CONSTANTS.UNDEFINED)
//         )
//             throw new TypeError(
//                 `Expected ${allowedTypes.join(" or ")} but got ${
//                     value === null ? "null" : "undefined"
//                 } for ${value}`,
//             );
//         else return;
//     }

//     let valid = false;
//     for (const t of allowedTypes) {
//         if (
//             t === PRIMITIVE_TYPE_CONSTANTS.NULL ||
//             t === PRIMITIVE_TYPE_CONSTANTS.UNDEFINED
//         )
//             continue;
//         if (typeof value === t) {
//             valid = true;
//             break;
//         }
//     }

//     if (!valid) {
//         throw new TypeError(
//             `Expected ${allowedTypes.join(" or ")} but got ${typeof value} for ${value}`,
//         );
//     }
// }

// export { checkParams };
