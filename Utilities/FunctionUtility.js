/**
 * @fileoverview Provides factory functions for for creating specialized utility objects.
 * This is the more functional side of utilities that do not serve as blueprints.
 * @author BlueLatios
 * @version 1.0.0
 */

import { DeepSeal } from "./UtilityHelpers.js";

/**
 * @typedef {Object} PrivateObjectBuilder
 * @property {function(string, *): PrivateObjectBuilder} addPrivateProperty - Adds a private property to the object
 * @property {function(string, *): PrivateObjectBuilder} addPublicProperty - Adds a public property to the object
 * @property {function(string, PrivateMethodCallback): PrivateObjectBuilder} addPublicMethod - Adds a method with access to private state
 * @property {function(string, GetterCallback): PrivateObjectBuilder} addGetter - Adds a getter for a private property
 * @property {function(string, SetterCallback): PrivateObjectBuilder} addSetter - Adds a setter for a private property
 * @property {function(string, GetterCallback, SetterCallback): PrivateObjectBuilder} addAccessor - Adds both getter and setter
 * @property {function(): Object} build - Finalizes and returns the sealed object
 */

/**
 * @callback PrivateMethodCallback
 * @param {Object} privateState - The encapsulated private state
 * @param {...*} args - Additional arguments passed to the method
 * @returns {*} The result of the method execution
 */

/**
 * @callback GetterCallback
 * @param {Object} privateState - The encapsulated private state
 * @returns {*} The value to be returned by the getter
 */

/**
 * @callback SetterCallback
 * @param {Object} privateState - The encapsulated private state
 * @param {*} value - The value being set
 * @returns {void}
 */

/**
 * Creates an object with truly private state using closures.
 *
 * This factory function provides a builder pattern for creating objects with
 * encapsulated private state that cannot be accessed from outside the object.
 * Unlike class-based privacy mechanisms, this approach offers genuine encapsulation
 * through JavaScript closures.
 * Compliant with SoraJS architecture.
 *
 * @template T
 * @param {Record<string, any>} [initialState={}]
 * @returns {Object} Builder with methods to create encapsulated objects
 *
 * @example
 * // Create a user object with private API key
 * const user = createPrivateState()
 *   .addPrivateProperty('apiKey', 'secret-key-123')
 *   .addPrivateProperty('email', 'user@example.com')
 *   .addPublicProperty('username', 'johndoe')
 *   .addPublicMethod('makeApiCall', (privateState, endpoint) => {
 *     return `Calling ${endpoint} with key ${privateState.apiKey}`;
 *   })
 *   .addGetter('email', (privateState) => privateState.email)
 *   .addSetter('email', (privateState, value) => {
 *     if (!value.includes('@')) throw new Error('Invalid email');
 *     privateState.email = value;
 *   })
 *   .addAccessor('role',
 *     (privateState) => privateState.role || 'user',
 *     (privateState, value) => {
 *       const allowedRoles = ['user', 'admin', 'guest'];
 *       if (!allowedRoles.includes(value)) throw new Error('Invalid role');
 *       privateState.role = value;
 *     }
 *   )
 *   .build();
 *
 * // The object's private state cannot be accessed:
 * console.log(user.username); // 'johndoe'
 * console.log(user.apiKey); // undefined - private property not accessible
 * console.log(user.makeApiCall('data')); // 'Calling data with key secret-key-123'
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures|MDN Closures}
 */
function createPrivateState(initialState = {}) {
    const privateState = { ...initialState };
    const publicInterface = {};

    return {
        /**
         * Adds a private property to the object's encapsulated state.
         *
         * @param {string} key - The property name
         * @param {*} value - The property value
         * @returns {PrivateObjectBuilder} The builder instance for chaining
         * @throws {TypeError} If key is not a string
         */
        addPrivateProperty(key, value) {
            privateState[key] = value;
            return this;
        },

        /**
         * Adds a public property directly accessible on the built object.
         *
         * @param {string} key - The property name
         * @param {*} value - The property value
         * @returns {PrivateObjectBuilder} The builder instance for chaining
         */
        addPublicProperty(key, value) {
            publicInterface[key] = value;
            return this;
        },

        /**
         * Adds a method that has access to the private state.
         * The first parameter passed to the method will be the private state object.
         *
         * @param {string} key - The method name
         * @param {PrivateMethodCallback} fn - The method implementation
         * @returns {PrivateObjectBuilder} The builder instance for chaining
         *
         * @example
         * .addPublicMethod('getUserData', (privateState, format) => {
         *   const data = { email: privateState.email, name: privateState.name };
         *   return format === 'json' ? JSON.stringify(data) : data;
         * })
         */
        addPublicMethod(key, fn) {
            publicInterface[key] = (...args) => fn(privateState, ...args);
            return this;
        },

        /**
         * Adds multiple public methods at once.
         *
         * @param {Object} functions - An object containing method names as keys and implementations as values
         * @returns {PrivateObjectBuilder} The builder instance for chaining
         *
         * @example
         * .addPublicMethods({
         *   getUserData: (privateState, format) => {
         *     const data = { email: privateState.email, name: privateState.name };
         *     return format === 'json' ? JSON.stringify(data) : data;
         *   },
         *   getFullName: (privateState) => `${privateState.firstName} ${privateState.lastName}`
         * })
         */
        addPublicMethods(functions) {
            Object.entries(functions).forEach(([key, fn]) => {
                this.addPublicMethod(key, fn);
            });
            return this;
        },

        /**
         * Defines a getter for accessing private state properties.
         *
         * @param {string} key - The property name for the getter
         * @param {GetterCallback} getterFn - Function that receives private state and returns a value
         * @returns {PrivateObjectBuilder} The builder instance for chaining
         *
         * @example
         * .addGetter('formattedEmail', (privateState) => {
         *   return `${privateState.name} <${privateState.email}>`;
         * })
         */
        addGetter(key, getterFn) {
            Object.defineProperty(publicInterface, key, {
                get: () => getterFn(privateState),
                enumerable: true,
                configurable: true,
            });
            return this;
        },

        /**
         * Defines a setter for modifying private state properties.
         *
         * @param {string} key - The property name for the setter
         * @param {SetterCallback} setterFn - Function that receives private state and the new value
         * @returns {PrivateObjectBuilder} The builder instance for chaining
         *
         * @example
         * .addSetter('password', (privateState, value) => {
         *   if (value.length < 8) throw new Error('Password too short');
         *   privateState.passwordHash = hashPassword(value);
         * })
         */
        addSetter(key, setterFn) {
            Object.defineProperty(publicInterface, key, {
                set: (value) => {
                    setterFn(privateState, value);
                },
                enumerable: true,
                configurable: true,
            });
            return this;
        },

        /**
         * Defines both getter and setter for a property in one call.
         *
         * @param {string} key - The property name
         * @param {GetterCallback} getterFn - Function that receives private state and returns a value
         * @param {SetterCallback} setterFn - Function that receives private state and the new value
         * @returns {PrivateObjectBuilder} The builder instance for chaining
         *
         * @example
         * .addAccessor('profile',
         *   (privateState) => ({ name: privateState.name, email: privateState.email }),
         *   (privateState, value) => {
         *     if (value && typeof value === 'object') {
         *       if (value.name) privateState.name = value.name;
         *       if (value.email) privateState.email = value.email;
         *     }
         *   }
         * )
         */
        addAccessor(key, getterFn, setterFn) {
            Object.defineProperty(publicInterface, key, {
                get: () => getterFn(privateState),
                set: (value) => {
                    setterFn(privateState, value);
                },
                enumerable: true,
                configurable: true,
            });
            return this;
        },

        /**
         * Finalizes the object creation and returns the sealed result.
         * After calling this method, the builder cannot be used anymore.
         *
         * @returns {Object} The constructed object with private state encapsulation
         */
        build() {
            return DeepSeal(publicInterface);
        },
    };
}

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

/**
 * A simple function to create delays in asynchronous programs.
 * @param {*} ms
 * @returns
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * An implementation of Kotlin's range function.
 * @param  {...any} values
 * @returns {Object} An object representing the range
 */
function range(_, ...values) {
    const [start, end] = values;
    return {
        start,
        end,
        includes(num) {
            return num >= start && num <= end;
        },
        *[Symbol.iterator]() {
            for (let i = start; i <= end; i++) yield i;
        },
        toArray() {
            return [...this];
        },
        map(fn) {
            return [...this].map(fn);
        },
    };
}

/**
 * Lazily evaluates a function.
 * @param {*} callback - The callback to be evaluated
 * @returns
 */
function lazy(callback) {
    let evaluated = false;
    let result;
    return function () {
        if (!evaluated) {
            result = callback();
            evaluated = true;
        }
        return result;
    };
}

export { createPrivateState, repeat, delay, range, lazy };
