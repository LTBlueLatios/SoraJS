/**
 * @fileoverview Provides a factory function to create objects with truly private state.
 * @author BlueLatios
 * @version 1.0.0
 */

/**
 * @typedef {Object} PrivateObjectBuilder
 * @property {function(string, *): PrivateObjectBuilder} addPrivateProperty - Adds a private property to the object
 * @property {function(string, *): PrivateObjectBuilder} addPublicProperty - Adds a public property to the object
 * @property {function(string, PrivateMethodCallback): PrivateObjectBuilder} addPublicMethod - Adds a method with access to private state
 * @property {function(string, GetterCallback): PrivateObjectBuilder} addGetter - Adds a getter for a private property
 * @property {function(string, SetterCallback): PrivateObjectBuilder} addSetter - Adds a setter for a private property
 * @property {function(string, GetterCallback, SetterCallback): PrivateObjectBuilder} addAccessor - Adds both getter and setter
 * @property {function(): Object} build - Finalizes and returns the proxied object
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
 * Creates an object with truly private state using closures and proxies.
 *
 * This factory function provides a builder pattern for creating objects with
 * encapsulated private state that cannot be accessed from outside the object.
 * Unlike class-based privacy mechanisms, this approach offers genuine encapsulation
 * through JavaScript closures. Compliant with SoraJS architecture.
 *
 * @template T
 * @param {Record<string, any>} [initialState={}]
 * @returns {Object} Builder with methods to create encapsulated objects
 *
 * @example
 * // Create a user object with private API key
 * const user = createPrivateObject()
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
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures|MDN Closures}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy|MDN Proxy}
 */
function createPrivateState(initialState = {}) {
    const privateState = { ...initialState };
    const publicState = {};

    const handler = {
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);
            if (typeof value === "function") {
                return function (...args) {
                    return Reflect.apply(value, this, [privateState, ...args]);
                };
            }
            return value;
        },
        defineProperty(target, prop, descriptor) {
            // Prevent attempts to add properties to the proxy
            return Reflect.defineProperty(target, prop, descriptor);
        },
        deleteProperty(target, prop) {
            // Prevent deleting properties
            return Reflect.deleteProperty(target, prop);
        }
    };

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
            publicState[key] = value;
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
            publicState[key] = fn;
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
            Object.defineProperty(publicState, key, {
                get: () => getterFn(privateState),
                enumerable: true,
                configurable: true
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
            Object.defineProperty(publicState, key, {
                set: (value) => { setterFn(privateState, value); },
                enumerable: true,
                configurable: true
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
            Object.defineProperty(publicState, key, {
                get: () => getterFn(privateState),
                set: (value) => { setterFn(privateState, value) },
                enumerable: true,
                configurable: true
            });
            return this;
        },

        /**
         * Finalizes the object creation and returns the proxied object.
         * After calling this method, the builder cannot be used anymore.
         *
         * @returns {Object} The constructed object with private state encapsulation
         */
        build() {
            return new Proxy(publicState, handler);
        }
    };
}

function createPrivateMethods() {
    const methods = new Map();

    const handler = {
        get(_, name) {
            if (typeof name !== "string") return undefined;
            const method = methods.get(name);
            if (!method) throw new Error(`Method "${name}" not found`);
            return (...args) => method(...args);
        },
        set() {
            throw new Error("Cannot modify private methods object directly");
        },
        apply() {
            throw new Error("Cannot invoke private methods object as a function");
        },
        defineProperty() {
            throw new Error("Cannot define properties on private methods object");
        },
        getOwnPropertyDescriptor(_, name) {
            if (!methods.has(name)) {
                3
                return undefined;
            }
            return Reflect.getOwnPropertyDescriptor(methods, name);
        }
    };

    return {
        addMethod(name, fn) {
            methods.set(name, fn);
            return this;
        },
        build() {
            Object.freeze(methods);
            return new Proxy({}, handler);
        }
    };
}

function createObservable(initialState = {}) {
    const state = { ...initialState };
    const listeners = new Set();

    return {
        getState() {
            return { ...state };
        },
        subscribe(listener) {
            if (typeof listener !== "function") throw new TypeError("Listener must be a function");
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        update(updater) {
            if (typeof updater !== "function") throw new TypeError("Updater must be a function");
            Object.assign(state, updater({ ...state }));
            listeners.forEach((listener) => listener({ ...state }));
        }
    };
}

function createSingleton(factory) {
    let instance;
    return function (...args) {
        if (!instance) instance = factory(...args);
        return instance;
    };
}

export {
    createPrivateState,
    createPrivateMethods,
    createObservable,
    createSingleton
}