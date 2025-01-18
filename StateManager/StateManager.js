/**
 * @class
 *
 * A basic class for state management. It currently does not have a name.
 * Future, more complex features are planned, however are not of top priority.
 */
class StateManager {
    states = new Map();
    #observers = new Map();

    /**
     * Registers a state with a name as its key.
     *
     * @param {*} name
     * @param {*} state
     */
    register(name, state) {
        this.states.set(name, state);
    }

    /**
     * Observes a state by name and provides a callback function
     * to call during updates.
     *
     * @param {*} name
     * @param {*} observer
     */
    observe(name, observer) {
        if (!this.states.has(name)) {
            throw new Error(`State ${name} is not registered`);
        }

        if (!this.#observers.has(name)) {
            this.#observers.set(name, new Set());
        }

        this.#observers.get(name).add(observer);
    }

    /**
     * Updates the state with the new data and calls any relevant callbacks.
     *
     * @param {*} stateName
     * @param {*} state
     */
    update(stateName, state) {
        if (!this.states.has(stateName)) {
            throw new Error(`State ${stateName} is not registered`);
        }

        const oldState = this.states.get(stateName);
        this.states.set(stateName, { ...oldState, ...state });

        if (this.#observers.has(stateName)) {
            this.#observers.get(stateName).forEach(observer => {
                observer(state);
            });
        }
    }
}

export default StateManager;