import lodash from "https://cdn.jsdelivr.net/npm/lodash/+esm"

/**
 * A highly optimized class for managing and emitting events.
 */
class SoulDew {
    #listeners = Object.create(null);
    #wildcardListeners = new Set();
    #isCancelled = false;
    #states = new Map();
    #changedKeys = new Set();

    /**
     * Adds an event listener.
     * @param {string} event - The name of the event to listen for.
     * @param {function} listener - The callback function to execute when the event is emitted.
     * @param {boolean} [once=false] - If true, the listener will be automatically removed after being invoked once.
     * @throws {TypeError} If event is not a string or listener is not a function.
     */
    on(event, listener, once = false) {
        if (typeof event !== "string" || typeof listener !== "function") throw new TypeError("Invalid arguments");

        const eventObj = { listener, once };

        if (event === "*") {
            this.#wildcardListeners.add(eventObj);
        } else {
            (this.#listeners[event] ??= new Set()).add(eventObj);
        }
    }

    /**
     * Removes an event listener.
     * @param {string} event - The name of the event to remove the listener from.
     * @param {function} listener - The callback function to remove.
     * @throws {TypeError} If event is not a string or listener is not a function.
     */
    off(event, listener) {
        if (typeof event !== "string" || typeof listener !== "function") throw new TypeError("Invalid arguments");

        if (event === "*") {
            for (const eventObj of this.#wildcardListeners) {
                if (eventObj.listener === listener) {
                    this.#wildcardListeners.delete(eventObj);
                    break;
                }
            }
        } else if (this.#listeners[event]) {
            for (const eventObj of this.#listeners[event]) {
                if (eventObj.listener === listener) {
                    this.#listeners[event].delete(eventObj);
                    if (this.#listeners[event].size === 0) {
                        delete this.#listeners[event];
                    }
                    break;
                }
            }
        }
    }

    /**
     * Links a state object to the event emitter.
     * @param {string} stateName - A unique name for the state.
     * @param {Object} state - The state object to observe.
     * @throws {TypeError} If stateName is not a string, object or is null.
     */
    observeState(stateName, state) {
        if (typeof stateName !== "string" || typeof state !== "object" || state === null) throw new TypeError("Invalid arguments");
        this.#states.set(stateName, state);
    }

    /**
     * Recursively updates state and tracks changed keys.
     * @param {Object} currentState - The current state object.
     * @param {Object} newState - The new state values to merge into the current state.
     * @private
     */
    #updateState(currentState, newState) {
        // No immutability (lodash.deepClone) since this module is performance critical
        lodash.mergeWith(currentState, newState, (objValue, srcValue, key) => {
            if (!lodash.isEqual(objValue, srcValue)) this.#changedKeys.add(key);
            if (Array.isArray(srcValue)) return srcValue;
        });
    }

    /**
     * Sets new values to properties in the observed state.
     * Emits a 'stateChange' event for the changed properties.
     * @param {string} stateName - The name of the state to update.
     * @param {Object} newState - An object with new state values to merge into the existing state.
     * @throws {Error} If the state does not exist.
     */
    setState(stateName, newState) {
        const currentState = this.#states.get(stateName);
        if (!currentState) throw new Error(`State "${stateName}" not found`);

        this.#changedKeys.clear();
        this.#updateState(currentState, newState);

        this.#changedKeys.forEach(key => {
            this.emit(`stateChange:${stateName}`, key, lodash.get(currentState, key));
        });
    }

    /**
     * Gets the state object by its name.
     * @param {string} stateName - The name of the state to retrieve.
     * @returns {Object} The state object.
     */
    getState(stateName) {
        return this.#states.get(stateName);
    }

    /**
     * Removes a state from observation.
     * @param {string} stateName - The name of the state to remove.
     */
    removeState(stateName) {
        this.#states.delete(stateName);
    }

    /**
     * Emits an event, calling all listeners registered for that event and all wildcard listeners.
     * @param {string} event - The name of the event to emit.
     * @param {...*} rest - Additional arguments to pass to the event listeners.
     * @throws {TypeError} If event is not a string.
     */
    emit(event, ...rest) {
        if (typeof event !== "string") throw new TypeError("Invalid event type");

        this.#isCancelled = false;
        let hasListeners = false;

        if (this.#listeners[event]) {
            hasListeners = true;
            this.#callListeners(this.#listeners[event], rest);
            if (this.#isCancelled) return;
        }

        this.#callListeners(this.#wildcardListeners, [event, ...rest]);
        if (!hasListeners && this.#wildcardListeners.size === 0) console.warn(`Event "${event}" has no listeners`);
    }

    /**
     * Internal method to call listeners and manage their lifecycle.
     * @param {Set} listeners - Set of listener objects.
     * @param {Array} rest - Arguments to pass to each listener.
     * @private
     */
    #callListeners(listeners, rest) {
        for (const event of listeners) {
            event.listener(...rest);
            if (this.#isCancelled) break;
            if (event.once) listeners.delete(event);
        }
    }

    /**
     * Cancels the current event emission.
     * This method should be called within an event listener to stop further processing of the current event.
     * Not supported in wildcard listeners!
     */
    cancel() {
        this.#isCancelled = true;
    }

    /**
     * Checks if there are any listeners for the specified event.
     * @param {string} event - The name of the event to check for listeners.
     * @returns {boolean} - True if there are listeners for the event, otherwise false.
     */
    hasListeners(event) {
        if (typeof event !== "string") throw new TypeError("Invalid event type");

        if (event === "*") {
            return this.#wildcardListeners.size > 0;
        }

        return (this.#listeners[event] && this.#listeners[event].size > 0);
    }

    /**
     * Clears all event listeners.
     */
    clearAllListeners() {
        this.#listeners = Object.create(null);
        this.#wildcardListeners.clear();
    }
}

export default SoulDew;