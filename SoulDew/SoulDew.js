import AltoMare from "./AltoMare";

class SoulDew {
    #listeners = new Map();
    #states = new Map();

    #altoMare = new AltoMare();

    /**
     * Adds an event listener.
     * @param {string} event - The name of the event to listen for.
     * @param {function} listener - The callback function to execute when the event is emitted.
     * @param {boolean} [once=false] - If true, the listener will be automatically removed after being invoked once.
     * @throws {TypeError} If event is not a string or listener is not a function.
     */
    on(event, listener, once = false) {
        this.#altoMare.checkParams(arguments, ["string", "function"]);
        const eventObj = { listener, once };

        if (!this.#listeners.has(event)) this.#listeners.set(event, []);
        this.#listeners.get(event).push(eventObj);
    }

    /**
     * Removes an event listener.
     * @param {string} event - The name of the event to remove the listener from.
     * @param {function} listener - The callback function to remove.
     * @throws {TypeError} If event is not a string or listener is not a function.
     */
    off(event, listener) {
        this.#altoMare.checkParams(arguments, ["string", "function"]);

        if (this.#listeners.has(event)) {
            const listeners = this.#listeners.get(event);
            const index = listeners.findIndex((obj) => obj.listener === listener);
            if (index !== -1) {
                listeners.splice(index, 1);
                if (listeners.length === 0) {
                    this.#listeners.delete(event);
                }
            }
        }
    }

    /**
     * Emits an event using CustomEvent.
     * @param {string} event - The name of the event to emit.
     * @param {*} [detail] - A value to be passed to the event listener.
     * @throws {TypeError} If event is not a string.
     */
    emit(event, detail) {
        this.#altoMare.checkParams(arguments, ["string", "any"]);
        const customEvent = new CustomEvent(event, { detail });

        if (this.#listeners.has(event)) {
            const listeners = this.#listeners.get(event);
            for (let i = 0; i < listeners.length; i+= 1) {
                const { listener, once } = listeners[i];

                listener(customEvent);
                if (once) {
                    listeners.splice(i, 1);
                    i-= 1;
                }
            }
        }

        document.dispatchEvent(customEvent);
    }

    /**
     * Links a state object to the state manager.
     * @param {string} stateName - A unique name for the state.
     * @param {Object} state - The state object to observe.
     * @throws {TypeError} If stateName is not a string, object, or null.
     */
    observeState(stateName, state) {
        this.#altoMare.checkParams(arguments, ["string", "object"]);
        this.#states.set(stateName, state);
    }

    /**
     * Sets new values to properties in the observed state.
     * Optionally emits a 'stateChange' event for the changed properties.
     * @param {string} stateName - The name of the state to update.
     * @param {Object} newState - An object with new state values to set directly onto the existing state.
     * @param {boolean} [emitEvent=true] - Whether to emit a 'stateChange' event.
     * @throws {Error} If the state does not exist.
     */
    setState(stateName, newState, emitEvent = true) {
        this.#altoMare.checkParams(arguments, ["string", "object", "boolean"]);

        const currentState = this.#states.get(stateName);
        if (!currentState) throw new Error(`State "${stateName}" not found`);

        for (const key in newState) {
            if (Object.hasOwn(newState, key)) {
                currentState[key] = newState[key];
                if (emitEvent) {
                    this.emit(`stateChange:${stateName}`, {
                        value: newState[key],
                    });
                }
            }
        }
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
}

export default SoulDew;