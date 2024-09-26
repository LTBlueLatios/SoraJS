import AltoMare from "./AltoMare";

class SoulDew {
    #listeners = new Map();
    #states = new Map();
    #stateQueue = new Map();
    #isProcessingState = false;
    #computedProperties = new Map();

    /**
     * Adds an event listener.
     * @param {string} event - The name of the event to listen for.
     * @param {function} listener - The callback function to execute when the event is emitted.
     * @param {boolean} [once=false] - If true, the listener will be automatically removed after being invoked once.
     * @throws {TypeError} If event is not a string or listener is not a function.
     */
    on(event, listener, once = false) {
        AltoMare.checkParams(arguments, ["string", "function", "boolean"]);
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
        AltoMare.checkParams(arguments, ["string", "function"]);

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
     * Emits an event asynchronously using queueMicrotask.
     * @param {string} event - The name of the event to emit.
     * @param {*} [detail] - A value to be passed to the event listener.
     * @throws {TypeError} If event is not a string.
     */
    emit(event, detail) {
        AltoMare.checkParams(arguments, ["string", "any"]);

        queueMicrotask(() => {
            const customEvent = new CustomEvent(event, { detail });

            if (this.#listeners.has(event)) {
                const listeners = this.#listeners.get(event);
                for (let i = 0; i < listeners.length; i += 1) {
                    const { listener, once } = listeners[i];

                    try {
                        listener(customEvent);
                    } catch (error) {
                        console.error(`Error in listener for event '${event}':`, error);
                    }
                    
                    if (once) {
                        listeners.splice(i, 1);
                        i -= 1;
                    }
                }
            }

            document.dispatchEvent(customEvent);
        });
    }

    /**
     * Links a state object to the state manager.
     * @param {string} stateName - A unique name for the state.
     * @param {Object} state - The state object to observe.
     * @throws {TypeError} If stateName is not a string, object, or null.
     */
    observeState(stateName, state) {
        AltoMare.checkParams(arguments, ["string", "object"]);
        this.#states.set(stateName, state);
    }

    /**
     * Sets new values to properties in the observed state.
     * Optionally emits a 'stateChange' event for the changed properties.
     * Uses a queue to batch state updates and prevent unnecessary re-renders.
     * @param {string} stateName - The name of the state to update.
     * @param {Object} newState - An object with new state values to set directly onto the existing state.
     * @param {boolean} [emitEvent=true] - Whether to emit a 'stateChange' event.
     * @throws {Error} If the state does not exist.
     */
    setState(stateName, newState, emitEvent = true) {
        AltoMare.checkParams(arguments, ["string", "object", "boolean"]);

        if (!this.#stateQueue.has(stateName)) {
            this.#stateQueue.set(stateName, {});
        }

        Object.assign(this.#stateQueue.get(stateName), newState);
        this.#processStateQueue(emitEvent);
    }

    /**
     * Processes the state update queue, applying changes and emitting events.
     * @param {boolean} emitEvent - Whether to emit state change events. 
     */
    #processStateQueue(emitEvent) {
        if (this.#isProcessingState) return;
        this.#isProcessingState = true;

        queueMicrotask(() => {
            for (const [stateName, changes] of this.#stateQueue) {
                const currentState = this.#states.get(stateName);
                if (!currentState) {
                    console.warn(`State "${stateName}" not found`);
                    continue;
                }

                for (const key in changes) {
                    if (Object.hasOwn(changes, key) && currentState[key] !== changes[key]) {
                        currentState[key] = changes[key];
                        if (emitEvent) {
                            this.emit(`stateChange:${stateName}`, {
                                key,
                                value: changes[key],
                            });
                        }
                    }
                }
            }

            this.#stateQueue.clear();
            this.#isProcessingState = false;
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
     * Subscribes to changes of a specific key within a state.
     * @param {string} stateName - The name of the state to subscribe to.
     * @param {string} key - The key within the state to listen for changes.
     * @param {function} callback - The function to be called when the key's value changes.
     * @returns {function} A function to unsubscribe from the changes. 
     */
    subscribe(stateName, key, callback) {
        const event = `stateChange:${stateName}`;

        const listener = (customEvent) => {
            if (customEvent.detail.key === key) {
                callback(customEvent.detail.value);
            }
        };

        this.on(event, listener);

        return () => this.off(event, listener);
    }

    /**
     * Adds a computed property to a state.
     * @param {string} stateName - The name of the state to add the computed property to.
     * @param {string} propertyName - The name of the computed property.
     * @param {function} computeFn - The function that computes the property's value.
     */
    addComputedProperty(stateName, propertyName, computeFn) {
        if (!this.#states.has(stateName)) {
            throw new Error(`State "${stateName}" not found. Cannot add computed property.`);
        }

        this.#computedProperties.set(`${stateName}.${propertyName}`, computeFn);

        const computedValue = computeFn(this.getState(stateName));
        this.setState(stateName, { [propertyName]: computedValue });

        this.on(`stateChange:${stateName}`, () => {
            const computedValue = computeFn(this.getState(stateName));
            this.setState(stateName, { [propertyName]: computedValue }, false);
        });
    }

    /**
     * Gets the value of a computed property.
     * @param {string} stateName - The name of the state.
     * @param {string} propertyName - The name of the computed property.
     * @returns {*} The value of the computed property.
     */
    getComputedProperty(stateName, propertyName) {
        return this.getState(stateName)[propertyName];
    }
}

const soulDew = new SoulDew();
export default soulDew;