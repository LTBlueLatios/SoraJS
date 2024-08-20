/**
 * A highly optimized class for managing and emitting events.
 */
class SoulDew {
    #listeners = Object.create(null);
    #wildcardListeners = new Set();
    #isCancelled = false;
    #states = new Map();

    /**
     * Adds an event listener.
     * @param {string} event - The name of the event to listen for.
     * @param {function} listener - The callback function to execute when the event is emitted.
     * @param {boolean} [once=false] - If true, the listener will be automatically removed after being invoked once.
     * @throws {TypeError} If event is not a string or listener is not a function.
     */
    on(event, listener, once = false) {
        if (typeof event !== "string" || typeof listener !== "function") {
            throw new TypeError("Invalid arguments");
        }

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
        if (typeof event !== "string" || typeof listener !== "function") {
            throw new TypeError("Invalid arguments");
        }

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
     * Links multiple state objects to the event emitter.
     * When any state changes, emits a 'stateChange' event specific to that state.
     * @param {string} stateName - A unique name for the state.
     * @param {Object} state - The state object to observe.
     */
    observeState(stateName, state) {
        if (typeof stateName !== "string" || typeof state !== "object" || state === null) throw new TypeError("Invalid arguments");

        const stateProxy = new Proxy(state, {
            set: (target, property, value) => {
                target[property] = value;
                this.emit(`stateChange:${stateName}`, property, value);
                return true;
            },
        });

        this.#states.set(stateName, { proxy: stateProxy });
    }

    /**
     * Gets the proxy-wrapped state object by its name.
     * @param {string} stateName - The name of the state to retrieve.
     * @returns {Object} The proxy-wrapped state object.
     */
    getState(stateName) {
        const state = this.#states.get(stateName);
        return state ? state.proxy : undefined;
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
     * @param {...*} args - Additional arguments to pass to the event listeners.
     * @returns {boolean} False if the event was cancelled, true otherwise.
     * @throws {TypeError} If event is not a string.
     */
    emit(event, ...args) {
        if (typeof event !== "string") throw new TypeError("Invalid event type");

        this.#isCancelled = false;
        let hasListeners = false;

        if (this.#listeners[event]) {
            hasListeners = true;
            this.#callListeners(this.#listeners[event], args);
            if (this.#isCancelled) return false;
        }

        this.#callListeners(this.#wildcardListeners, [event, ...args]);

        if (!hasListeners && this.#wildcardListeners.size === 0) {
            console.warn(`Event "${event}" has no listeners`);
        }

        return !this.#isCancelled;
    }

    /**
     * Internal method to call listeners and manage their lifecycle.
     * @param {Set} listeners - Set of listener objects.
     * @param {Array} args - Arguments to pass to each listener.
     * @private
     */
    #callListeners(listeners, args) {
        for (const event of listeners) {
            event.listener(...args);
            if (this.#isCancelled) break;
            if (event.once) listeners.delete(event);
        }
    }

    /**
     * Cancels the current event emission.
     * This method should be called within an event listener to stop further processing of the current event.
     */
    cancel() {
        this.#isCancelled = true;
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