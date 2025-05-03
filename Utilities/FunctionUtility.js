/**
 * Executes a function a specified number of times.
 *
 * @example
 * const add = (a, b) => a + b;
 * const addFive = repeat(add, 5);
 * console.log(addFive(2, 3)); // 5
 *
 * @todo Consider memoisation capibilities
 *
 * @param {Function} func - The function to be executed
 * @param {number} times - The number of times to execute the function
 * @returns {Function} A new function that executes the original function the specified number of times
 */
function repeat(func, times) {
    return function (/** @type {any} */ ...args) {
        let result;
        for (let i = 0; i < times; i++) result = func(...args);
        return result;
    };
}

export { repeat };
