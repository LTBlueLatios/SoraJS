/**
 * A simple registry for storing values in a private scope
 * @abstract This simple registry provides a way to store values in a private scope without exposing them.
 * This was made as I persoanlly fade out the usage of classes with private fields according to
 * my architecture. This registry allows object literals to be used in place of classes.
 * @example
 * ```js
 * import { register, get, remove } from "./PrivateRegistry.js";
 *
 * register("namespace", "key", "value");
 * console.log(get("namespace", "key")); // "value"
 * remove("namespace", "key");
 * console.log(get("namespace", "key")); // undefined
 * ```
 * @module Utilities/PrivateRegistry
 */

// Private storage
const store = new Map();

/**
 * Registers a value under a namespace and key
 * @param {string} namespace - The top level category
 * @param {string} key - The identifier within the namespace
 * @param {any} value - Any JavaScript value to store
 */
export function register(namespace, key, value) {
    if (!store.has(namespace)) {
        store.set(namespace, new Map());
    }
    store.get(namespace).set(key, value);
}

/**
 * Retrieves a value from the registry
 * @param {string} namespace - The namespace to look in
 * @param {string} key - The key to retrieve
 * @returns {any} The stored value or undefined
 */
export function get(namespace, key) {
    return store.get(namespace)?.get(key);
}

/**
 * Checks if a value exists in the registry
 */
export function has(namespace, key) {
    return Boolean(store.get(namespace)?.has(key));
}

/**
 * Removes an entry from the registry
 * @returns {boolean} True if successfully removed
 */
export function remove(namespace, key) {
    return store.get(namespace)?.delete(key) || false;
}

/**
 * Lists all keys in a namespace
 */
export function keys(namespace) {
    return [...(store.get(namespace)?.keys() || [])];
}

/**
 * Lists all available namespaces
 */
export function namespaces() {
    return [...store.keys()];
}

/**
 * Get all entries in a namespace as an object
 */
export function getNamespace(namespace) {
    const result = {};
    const namespaceMap = store.get(namespace);

    if (namespaceMap) {
        for (const [key, value] of namespaceMap.entries()) {
            result[key] = value;
        }
    }

    return result;
}