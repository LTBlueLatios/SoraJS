/**
 * @fileoverview Provides blueprint classes for creating specialized utility objects.
 * Each class serves as a factory for generating instances with encapsulated
 * functionality. This file is a prime example for how classes are intended to be used,
 * especially within the SoraJS architecture. Inheritence and polymorphism of classes are banned,
 * interfaces and composition are used to replace inheritence and provide a more developer friendly and extensible way to define behavior.
 *
 * SoraJS's architecture intends to be explicit, inheritence and polymorphism is not. Classes
 * serve as blueprints, not to create singletons or to form a complex inheritence model.
 *
 * @author BlueLatios
 * @version 2.0.0
 */

/**
 * @class
 * @classdesc Creates an event emitter instance that is the fastest possible
 * event emitter implementation for JavaScript.
 */
class EventEmitter {
    #events = new Map();

    /**
     * Registers a callback for a specific event type
     * @param {string} eventType - The type of event to listen for
     * @param {Function} callback - The callback function to be called when the event is emitted
     */
    on(eventType, callback) {
        const listeners = this.#events.get(eventType);
        if (!listeners) {
            this.#events.set(eventType, new Set([callback]));
        } else {
            listeners.add(callback);
        }
    }

    /**
     * Emits an event with the given data
     * @param {string} eventType - The type of event to emit
     * @param {any} data - The data to be passed to the event listeners
     */
    emit(eventType, data) {
        const listeners = this.#events.get(eventType);
        if (!listeners) return;
        for (const listener of listeners) listener(data);
    }

    /**
     * Removes a callback for a specific event type
     * @param {string} eventType - The type of event to stop listening for
     * @param {Function} callback - The callback function to be removed
     */
    off(eventType, callback) {
        const listeners = this.#events.get(eventType);
        if (!listeners) return;
        listeners.delete(callback);
        if (listeners.size === 0) this.#events.delete(eventType);
    }
}

/**
 * @class Observable
 * @classdesc A class that provides simple state management.
 *
 * @example
 * ```js
 * const observable = new Observable({ count: 0 });
 * observable.subscribe((state) => console.log(state.count));
 * observable.update((state) => ({ count: state.count + 1 }));
 * ```
 */
class Observable {
    #state;
    #listeners = new Set();

    /**
     * Provides the initial state to use for the observable.
     * @constructor
     * @param {Object} initialState - The initial state of the observable.
     */
    constructor(initialState = {}) {
        this.#state = initialState;
    }

    /**
     * Subscribes a listener to the observable.
     * @param {Function} listener - The listener to subscribe.
     * @returns {Function} A function to unsubscribe the listener.
     */
    subscribe(listener) {
        if (typeof listener !== "function")
            throw new TypeError("Listener must be a function");
        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    }

    /**
     * Updates the state of the observable.
     * @param {Function} updater - The function to update the state.
     */
    update(updater) {
        if (typeof updater !== "function")
            throw new TypeError("Updater must be a function");
        Object.assign(this.#state, updater({ ...this.#state }));
        for (const listener of this.#listeners) listener({ ...this.#state });
    }
}

/**
 * @class PluginRegistry
 * @classdesc Provides a simple registry to hold plugins that are compliant
 * with SoraJS's architecture.
 *
 * @example
 * ```js
 * const registry = new PluginRegistry(["plugin"]);
 * registry.register("plugin", [
 *     { name: "plugin1", version: "1.0.0" },
 *     { name: "plugin2", version: "2.0.0" }
 * ]);
 * console.log(registry.get("plugin", "plugin1"));
 * ```
 */
class PluginRegistry {
    #plugins = new Map();

    /**
     * Builds the registry with the specified store types.
     * @param {Array} storeTypes - The types of items to store
     */
    constructor(storeTypes) {
        if (!Array.isArray(storeTypes))
            throw new Error("storeTypes must be an array");

        for (const type of storeTypes) {
            this.#plugins.set(type, new Map());
        }
    }

    /**
     * Registers a list of items to the registry.
     * @param {string} type - The type of items to register
     * @param {Array} items - The items to register
     */
    register(type, items) {
        if (!Array.isArray(items))
            throw new Error("Invalid items provided for registration");

        const handler = this.#plugins.get(type);
        if (!handler) throw new Error(`Unknown type: ${type}`);

        for (const item of items) {
            if (!item.name) throw new Error("Item must have a name property");
            handler.set(item.name, item);
        }
    }
    /**
     * Retrieves an item from the registry.
     * @param {string} type - The type of item to retrieve
     * @param {string} data - The name of the item to retrieve
     * @returns {Object} The item from the registry
     */
    get(type, data) {
        const handler = this.#plugins.get(type);
        if (!handler) throw new Error(`Unknown type: ${type}`);

        const item = handler.get(data);
        if (!item) throw new Error(`Unknown item: ${data}`);

        return item;
    }
}

/**
 * A class that manages a pool of reusable objects for performance-sensitive
 * applications where object creation and destruction are costly.
 */
class ObjectPool {
    #available = [];
    #inUse = new Set();

    /**
     * Creates a new object pool instance
     *
     * @param {Function} [factory] - Optional factory function to create new objects
     * @param {Function} [reset] - Optional function to reset objects before reuse
     */
    constructor(
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
        this.factory = factory;
        this.reset = reset;
    }

    /**
     * Initialize the pool with a specific number of objects
     *
     * @param {number} amount - Number of objects to pre-create
     * @returns {ObjectPool} This instance for method chaining
     */
    initialize(amount) {
        if (amount < 0) throw new Error("Amount must be non-negative");

        for (let i = 0; i < amount; i++) {
            const obj = this.factory();
            this.#available.push(obj);
        }

        return this;
    }

    /**
     * Get an object from the pool or create a new one if none available
     *
     * @param {boolean} [createIfEmpty=true] - Whether to create a new object if pool is empty
     * @returns {Object} An object from the pool
     * @throws {Error} If the pool is empty and createIfEmpty is false
     */
    get(createIfEmpty = true) {
        let obj;

        if (this.#available.length > 0) {
            obj = this.#available.pop();
        } else if (createIfEmpty) {
            obj = this.factory();
        } else {
            throw new Error("No objects available in the pool");
        }

        this.#inUse.add(obj);
        return obj;
    }

    /**
     * Release an object back to the pool
     *
     * @param {Object} obj - The object to release
     * @throws {TypeError} If the provided value is not an object
     * @throws {Error} If the object was not acquired from this pool
     */
    release(obj) {
        if (obj === null || typeof obj !== "object") {
            throw new TypeError("Only objects can be released");
        }

        if (!this.#inUse.has(obj)) {
            throw new Error("Object was not acquired from this pool");
        }

        this.#inUse.delete(obj);
        this.reset(obj);
        this.#available.push(obj);
    }

    /**
     * Clear all objects from the pool
     */
    clear() {
        this.#available.length = 0;
        this.#inUse.clear();
    }

    /**
     * Get information about the pool's current state
     *
     * @returns {Object} Pool statistics with available, inUse, and total counts
     */
    getStatus() {
        return {
            available: this.#available.length,
            inUse: this.#inUse.size,
            total: this.#available.length + this.#inUse.size,
        };
    }

    /**
     * Pre-allocate additional objects to the pool
     *
     * @param {number} amount - Number of objects to add
     * @returns {ObjectPool} This instance for method chaining
     */
    grow(amount) {
        return this.initialize(amount);
    }

    /**
     * Release all in-use objects back to the pool
     */
    releaseAll() {
        [...this.#inUse].forEach((obj) => this.release(obj));
    }
}

/**
 * @class
 *
 * @classdesc An implementation for efficiently managing and generating IDs.
 * Generates the lowest available ID and reclaims IDs when they are
 * released.

 * @todo Extract MinHeap from PriorityQueue into AlgorithmUtility and implement
 * the MinHeap in the IDGenerator.
 */
class IDGenerator {
    #nextID = 0;
    #reclaimedIDs = [];

    /**
     * Creates and returns a new unique ID
     * @returns {number} A unique ID
     */
    create() {
        if (this.#reclaimedIDs.length > 0) {
            return this.#reclaimedIDs.shift();
        }

        return this.#nextID++;
    }

    /**
     * Releases an ID so it can be reused
     * @param {number} id - The ID to release
     * @returns {boolean} True if the ID was successfully released, false otherwise
     */
    release(id) {
        if (id < 0 || id >= this.#nextID || this.#reclaimedIDs.includes(id)) {
            return false;
        }

        let insertIndex = 0;
        while (
            insertIndex < this.#reclaimedIDs.length &&
            this.#reclaimedIDs[insertIndex] < id
        ) {
            insertIndex++;
        }

        this.#reclaimedIDs.splice(insertIndex, 0, id);
        return true;
    }

    /**
     * Releases an ID so it can be reused
     * @param {number} id - The ID to release
     * @returns {boolean} True if the ID was successfully released, false otherwise
     */
    isValid(id) {
        return id >= 0 && id < this.#nextID && !this.#reclaimedIDs.includes(id);
    }

    /**
     * Returns the number of active IDs currently in use
     * @returns {number} The count of active IDs
     */
    getActiveCount() {
        return this.#nextID - this.#reclaimedIDs.length;
    }

    /**
     * Resets the ID generator to its initial state
     */
    reset() {
        this.#nextID = 0;
        this.#reclaimedIDs = [];
    }
}

/**
 * @abstract An implementation for structs within JavaScript, following SoraJS's architecture.
 *
 * Structs provide a way to define templates for objects with explicit property definitions
 * and default values. It also serves the role of providing explicit documentation of intended
 * object structures within SoraJS's architecture.
 *
 * @example
 * ```js
 * // Define a User struct
 * const UserStruct = new Struct({
 *     id: '',
 *     name: '',
 *     email: '',
 *     isActive: false,
 *     createdAt: null
 * });
 *
 * // Create a user instance
 * const user = UserStruct.spawn({
 *     id: '123',
 *     name: 'John Doe',
 *     email: 'john@example.com',
 *     isActive: true,
 *     createdAt: new Date()
 * });
 * ```
 */
class Struct {
    #template;
    static DEFAULT_VALUES = {
        number: 0,
        object: {},
        string: "",
    };

    // @ts-ignore
    static FUNCTION_VALUES = new Map([
        [Function, () => {}],
        [Map, new Map()],
        [Set, new Set()],
        [Array, []],
        [Date, new Date()],
    ]);

    constructor(template) {
        this.#template = template;
    }

    spawn(values) {
        const result = {};

        for (const [key, value] of Object.entries(this.#template)) {
            const providedValue = values[key];

            if (providedValue === undefined) {
                result[key] =
                    typeof value === "function" && value.prototype
                        ? Struct.FUNCTION_VALUES.get(value) || null
                        : Struct.DEFAULT_VALUES[value];
                continue;
            }

            if (value === null) {
                result[key] = providedValue;
                continue;
            }

            if (typeof value === "function" && value.prototype) {
                if (!(providedValue instanceof value)) {
                    result[key] = Struct.FUNCTION_VALUES.get(value) || null;
                    continue;
                }
            } else if (typeof providedValue != typeof value) {
                result[key] = Struct.DEFAULT_VALUES[typeof value] ?? value;
                continue;
            }

            result[key] = providedValue;
        }

        return result;
    }
}

/**
 * @todo Extract MinHeap
 */
class PriorityQueue {
    #heap = [];

    /**
     * @param {function(any, any): number} comparator
     */
    constructor(comparator = (a, b) => a - b) {
        this.comparator = comparator;
    }

    /**
     * Processes the entire queue with a callback function
     * @param {Function} processor - Function to process each element
     * @param {number} [limit=Infinity] - Maximum number of elements to process
     * @returns {Array} Array of processed elements
     */
    processQueue(processor, limit = Infinity) {
        const results = [];
        let count = 0;

        while (!this.isEmpty() && count < limit) {
            const item = this.dequeue();
            const result = processor(item);
            results.push(result);
            count++;
        }

        return results;
    }

    /**
     * Adds an element to the queue
     * @param {*} element - The element to add to the queue
     */
    enqueue(element) {
        this.#heap.push(element);
        this.#siftUp(this.#heap.length - 1);
    }

    /**
     * Removes and returns the top element from the queue
     * @returns {*} The top element from the queue
     */
    dequeue() {
        if (this.#heap.length === 0) return null;

        const top = this.#heap[0];
        const bottom = this.#heap.pop();

        if (this.#heap.length > 0) {
            this.#heap[0] = bottom;
            this.#siftDown(0);
        }

        return top;
    }

    /**
     * @returns {Number}
     */
    size() {
        return this.#heap.length;
    }

    /**
     * @returns - {boolean}
     */
    isEmpty() {
        return this.#heap.length === 0;
    }

    peek() {
        return this.#heap.length > 0 ? this.#heap[0] : null;
    }

    /**
     * Removes a specific item from the queue
     * @param {*} item - The item to remove
     * @returns {boolean} True if the item was removed, false otherwise
     */
    delete(item) {
        const index = this.#heap.indexOf(item);
        if (index === -1) return false;

        const lastElement = this.#heap.pop();
        if (index === this.#heap.length) return true;

        this.#heap[index] = lastElement;
        this.#siftDown(index);
        return true;
    }

    #siftUp(index) {
        let parent = Math.floor((index - 1) / 2);

        while (
            index > 0 &&
            this.comparator(this.#heap[parent], this.#heap[index]) > 0
        ) {
            [this.#heap[parent], this.#heap[index]] = [
                this.#heap[index],
                this.#heap[parent],
            ];
            index = parent;
            parent = Math.floor((index - 1) / 2);
        }
    }

    #siftDown(index) {
        const length = this.#heap.length;
        let element = index;

        let hasSwapped = true;
        while (hasSwapped) {
            let leftChild = 2 * element + 1;
            let rightChild = 2 * element + 2;
            let smallest = element;

            if (
                leftChild < length &&
                this.comparator(this.#heap[leftChild], this.#heap[smallest]) < 0
            ) {
                smallest = leftChild;
            }

            if (
                rightChild < length &&
                this.comparator(this.#heap[rightChild], this.#heap[smallest]) <
                    0
            ) {
                smallest = rightChild;
            }

            hasSwapped = smallest !== element;

            if (hasSwapped) {
                [this.#heap[element], this.#heap[smallest]] = [
                    this.#heap[smallest],
                    this.#heap[element],
                ];
                element = smallest;
            }
        }
    }
}

export {
    EventEmitter,
    Observable,
    PluginRegistry,
    ObjectPool,
    IDGenerator,
    Struct,
    PriorityQueue,
};
