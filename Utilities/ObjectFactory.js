/**
 * @fileoverview Provides several factory functions to accomplish different tasks.
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
 * @typedef EmitterObject
 * @property {function(string, Function): void} on - Registers a callback for a specific event type
 * @property {function(string, any): void} emit - Emits an event with optional data
 * @property {function(string, Function): void} off - Removes a callback for a specific event type
 */

/**
 * Creates an event emitter object. The returned object is the fastest possible
 * event emitter implementation for JavaScript.
 *
 * @returns {EmitterObject} An event emitter object with on, emit, and off methods
 */
function createEmitter() {
    const events = new Map();

    return {
        /**
         * Registers a callback for a specific event type
         * @param {string} eventType - The type of event to listen for
         * @param {Function} callback - The callback function to be called when the event is emitted
         */
        on(eventType, callback) {
            if (!events.has(eventType)) events.set(eventType, new Set());
            events.get(eventType).add(callback);
        },
        /**
         * Emits an event with the given data
         * @param {string} eventType - The type of event to emit
         * @param {any} data - The data to be passed to the event listeners
         */
        emit(eventType, data) {
            const listeners = events.get(eventType);
            if (!listeners) return;
            // Optimisation Lesson!
            // Direct for loops are the fastest way to iterate
            // over a Set. `Array.forEach` has slightly more overhead.
            for (const listener of listeners) listener(data);
        },
        /**
         * Removes a callback for a specific event type
         * @param {string} eventType - The type of event to stop listening for
         * @param {Function} callback - The callback function to be removed
         */
        off(eventType, callback) {
            const listeners = events.get(eventType);
            if (!listeners) return;
            listeners.delete(callback);
            if (listeners.size === 0) events.delete(eventType);
        },
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
            if (typeof listener !== "function")
                throw new TypeError("Listener must be a function");
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        update(updater) {
            if (typeof updater !== "function")
                throw new TypeError("Updater must be a function");
            Object.assign(state, updater({ ...state }));
            listeners.forEach((listener) => listener({ ...state }));
        },
    };
}

/**
 * @typedef {Object} PluginRegistry
 * @property {function(Array): PluginRegistry} build - Builds the registry with the specified store types
 * @property {function(string, Array): void} register - Registers a list of items to the registry
 * @property {function(string, string): Object} get - Retrieves an item from the registry
 */
function createPluginRegistry() {
    const store = new Map();
    let initialised = false;

    return {
        /**
         * Builds the registry with the specified store types.
         * @param {Array} storeTypes - The types of items to store
         */
        build(storeTypes) {
            if (!Array.isArray(storeTypes))
                throw new Error("storeTypes must be an array");

            for (const type of storeTypes) {
                store.set(type, new Map());
            }

            Object.seal(store);
            initialised = true;
        },
        /**
         * Registers a list of items to the registry.
         * @param {string} type - The type of items to register
         * @param {Array} items - The items to register
         */
        register(type, items) {
            if (!initialised) throw new Error("Registry is not initialised!");
            if (!Array.isArray(items))
                throw new Error("Invalid items provided for registration");

            const handler = store.get(type);
            if (!handler) throw new Error(`Unknown type: ${type}`);

            for (const item of items) {
                if (!item.name)
                    throw new Error("Item must have a name property");
                handler.set(item.name, item);
            }
        },
        /**
         * Retrieves an item from the registry.
         * @param {string} type - The type of item to retrieve
         * @param {string} data - The name of the item to retrieve
         * @returns {Object} The item from the registry
         */
        get(type, data) {
            if (!initialised) throw new Error("Registry is not initialised!");

            const handler = store.get(type);
            if (!handler) throw new Error(`Unknown type: ${type}`);

            const item = handler.get(data);
            if (!item) throw new Error(`Unknown item: ${data}`);

            return item;
        },
    };
}

/**
 * Creates an object pool for managing reusable objects. This
 * should be used for performance-sensitive applications
 * where object creation and destruction are costly.
 *
 * @param {Function} [factory] - Optional factory function to create new objects
 * @param {Function} [reset] - Optional function to reset objects before reuse
 * @returns {Object} An object pool with methods to manage object lifecycle
 */
function createObjectPool(
    factory = () => ({}),
    reset = (obj) => {
        // Clear all properties by default
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                delete obj[key];
            }
        }
        return obj;
    },
) {
    const available = [];
    const inUse = new Set();

    return {
        /**
         * Initialize the pool with a specific number of objects
         * @param {number} amount - Number of objects to pre-create
         */
        initialize(amount) {
            if (amount < 0) throw new Error("Amount must be non-negative");

            for (let i = 0; i < amount; i++) {
                const obj = factory();
                available.push(obj);
            }

            return this;
        },

        /**
         * Get an object from the pool or create a new one if none available
         * @param {boolean} [createIfEmpty=true] - Whether to create a new object if pool is empty
         * @returns {Object} An object from the pool
         */
        get(createIfEmpty = true) {
            let obj;

            if (available.length > 0) {
                obj = available.pop();
            } else if (createIfEmpty) {
                obj = factory();
            } else {
                throw new Error("No objects available in the pool");
            }

            inUse.add(obj);
            return obj;
        },

        /**
         * Release an object back to the pool
         * @param {Object} obj - The object to release
         */
        release(obj) {
            if (obj === null || typeof obj !== "object") {
                throw new TypeError("Only objects can be released");
            }

            if (!inUse.has(obj)) {
                throw new Error("Object was not acquired from this pool");
            }

            inUse.delete(obj);
            reset(obj);
            available.push(obj);
        },

        /**
         * Clear all objects from the pool
         */
        clear() {
            available.length = 0;
            inUse.clear();
        },

        /**
         * Get information about the pool's current state
         * @returns {Object} Pool statistics
         */
        getStatus() {
            return {
                available: available.length,
                inUse: inUse.size,
                total: available.length + inUse.size,
            };
        },

        /**
         * Pre-allocate additional objects to the pool
         * @param {number} amount - Number of objects to add
         */
        grow(amount) {
            return this.initialize(amount);
        },

        /**
         * Release all in-use objects back to the pool
         */
        releaseAll() {
            // Convert to array since we'll be modifying the set during iteration
            [...inUse].forEach((obj) => this.release(obj));
        },
    };
}

/**
 * @typedef {Object} IDGeneratorInstance
 * @property {number} nextID - The next ID to be assigned
 * @property {number[]} reclaimedIDs - Array of IDs that have been released and can be reused
 */
function createIDGenerator() {
    let nextID = 0;
    let reclaimedIDs = [];

    return {
        /**
         * Creates and returns a new unique ID
         * @returns {number} A unique ID
         */
        create() {
            if (reclaimedIDs.length > 0) {
                return reclaimedIDs.shift();
            }

            return nextID++;
        },

        /**
         * Releases an ID so it can be reused
         * @param {number} id - The ID to release
         * @returns {boolean} True if the ID was successfully released, false otherwise
         */
        release(id) {
            if (id < 0 || id >= nextID || reclaimedIDs.includes(id)) {
                return false;
            }

            let insertIndex = 0;
            while (
                insertIndex < reclaimedIDs.length &&
                reclaimedIDs[insertIndex] < id
            ) {
                insertIndex++;
            }

            reclaimedIDs.splice(insertIndex, 0, id);
            return true;
        },
        /**
         * Checks if an ID is valid and currently in use
         * @param {number} id - The ID to check
         * @returns {boolean} True if the ID is valid and in use, false otherwise
         */
        isValid(id) {
            return id >= 0 && id < nextID && !reclaimedIDs.includes(id);
        },
        /**
         * Returns the number of active IDs currently in use
         * @returns {number} The count of active IDs
         */
        getActiveCount() {
            return nextID - reclaimedIDs.length;
        },
        /**
         * Resets the ID generator to its initial state
         */
        reset() {
            nextID = 0;
            reclaimedIDs = [];
        },
    };
}

/**
 * An implementation for structs within JavaScript, following SoraJS's architecture.
 *
 * @abstract
 * Structs provide a way to define templates for objects with explicit property definitions
 * and default values. It also serves the role of providing explicit documentation of intended
 * object structures within SoraJS's architecture.
 *
 * Unlike classes, structs focus purely on data structure without methods or inheritance.
 * The returned objects are sealed to prevent adding new properties after creation.
 *
 * @param {Object} template - The blueprint object containing default property values
 * @returns {Object} An object with a spawn method for creating instances of the struct
 *
 * @example
 * // Define a User struct
 * const UserStruct = createStruct({
 *   id: '',
 *   name: '',
 *   email: '',
 *   isActive: false,
 *   createdAt: null
 * });
 *
 * // Create a user instance
 * const user = UserStruct.spawn({
 *   id: '123',
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   isActive: true,
 *   createdAt: new Date()
 * });
 *
 * todo - Add type checks and validation.
 */
function createStruct(template) {
    return {
        /**
         * Creates an instance of the struct by combining the template with provided values.
         * The resulting object is sealed to prevent adding new properties.
         *
         * @param {Object} values - Values to override defaults from the template
         * @returns {Object} A sealed object with properties from both template and values
         */
        spawn(values) {
            return DeepSeal({
                ...template,
                ...values,
            });
        },
    };
}

/**
 * Creates a priority queue data structure using a heap.
 *
 * @returns {Object} An object with methods to define priorities, add tasks, and get the next task.
 */
function createPriorityQueue(priorities = {}) {
    const heap = [];
    let priorityMap = priorities;

    return {
        addTask(task) {
            heap.push(task);
            this.bubbleUp(heap.length - 1);
        },

        getNextTask() {
            if (heap.length === 0) return null;

            const task = heap[0];
            heap[0] = heap[heap.length - 1];
            heap.pop();

            if (heap.length > 0) this.sinkDown(0);
            return task;
        },

        getAllTasks() {
            return [...heap];
        },

        clearAllTasks() {
            heap.length = 0;
        },

        // This is debug code, remove!
        getHeap() {
            return heap;
        },

        getParentIndex(i) {
            return Math.floor((i - 1) / 2);
        },

        getLeftChildIndex(i) {
            return 2 * i + 1;
        },

        getRightChildIndex(i) {
            return 2 * i + 2;
        },

        hasParent(i) {
            return this.getParentIndex(i) >= 0;
        },

        hasLeftChild(i) {
            return this.getLeftChildIndex(i) < heap.length;
        },

        hasRightChild(i) {
            return this.getRightChildIndex(i) < heap.length;
        },

        swap(i, j) {
            [heap[i], heap[j]] = [heap[j], heap[i]];
        },

        bubbleUp(i) {
            while (
                this.hasParent(i) &&
                priorityMap[heap[i].priority] >
                    priorityMap[heap[this.getParentIndex(i)].priority]
            ) {
                const parentIndex = this.getParentIndex(i);
                this.swap(i, parentIndex);
                i = parentIndex;
            }
        },

        sinkDown(i) {
            let maxIndex = i;

            while (true) {
                if (
                    this.hasLeftChild(i) &&
                    priorityMap[heap[this.getLeftChildIndex(i)].priority] >
                        priorityMap[heap[maxIndex].priority]
                ) {
                    maxIndex = this.getLeftChildIndex(i);
                }

                if (
                    this.hasRightChild(i) &&
                    priorityMap[heap[this.getRightChildIndex(i)].priority] >
                        priorityMap[heap[maxIndex].priority]
                ) {
                    maxIndex = this.getRightChildIndex(i);
                }

                if (maxIndex === i) break;

                this.swap(i, maxIndex);
                i = maxIndex;
            }
        },
    };
}

export {
    createPrivateState,
    createEmitter,
    createObservable,
    createPluginRegistry,
    createObjectPool,
    createIDGenerator,
    createStruct,
    createPriorityQueue,
};
