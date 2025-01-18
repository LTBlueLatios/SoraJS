import { checkParams, TYPE_CONSTANTS } from "../Utilities/CheckType.js";

/**
 * @class
 *
 * # Pipeline Philosophy
 *
 * ##
 * We've already added sleeping and once functionality.
 *
 * We need to add custom emitters and a priority queue. Big changes
 * are being held back for now, like splitting handlers into workers.
 * We also need to add configuration for the general pipeline.
 */
class Pipeline {
    #name;
    #validEvents;
    #handlers = new Map();
    #responseHandlers = new Map();
    #sleeping = new Set();

    /**
     * @constructor
     * @param {string} name
     * @param {string[]} validEvents
     */
    constructor(name, validEvents) {
        this.#name = name;
        this.#validEvents = new Set(validEvents);
    }

    /**
     * Emits an event through the pipeline.
     * Unlike traditional event emitters, events are validated against the pipeline's
     * registered event types.
     *
     *
     * @param {string} eventName - Name of the event to emit
     * @param {*} data - Data to pass to handlers
     * @param {object} requiresAcknowledgement - Whether to return an acknowledgement
     * @throws {Error} If event is not registered for this pipeline
     */
    // This is where we have a special problem, since options is an object but
    // requires a schema to verify. I bet this is where we use AltoMare to handle the problem.
    emit(eventName, data, options = {}) {
        checkParams(arguments, [TYPE_CONSTANTS.STRING, TYPE_CONSTANTS.ANY, TYPE_CONSTANTS.OBJECT]);

        if (!this.#validEvents.has(eventName)) {
            throw new Error(`Event ${eventName} is not registered for pipeline ${this.#name}`);
        }

        let acknowledged = false;
        const handlers = this.#handlers.get(eventName);
        if (handlers) {
            for (const handler of handlers) {
                if (this.#sleeping.has(handler)) continue;
                handler(data);
                acknowledged = true;
            }
        }

        if (options.requiresAcknowledgement) return acknowledged;
    }

    /**
      * Makes a request through the pipeline and expects a response.
      * This implements the bi-directional communication pattern.
      *
      * @param {string} eventName - Name of the event to request
      * @param {*} data - Data to pass to handlers
      * @throws {Error} If event is not registered for this pipeline
      * @returns {*} Response from the first handler that returns a non-undefined value
      */
    request(eventName, data) {
        checkParams(arguments, [TYPE_CONSTANTS.STRING, TYPE_CONSTANTS.ANY]);

        if (!this.#validEvents.has(eventName)) {
            throw new Error(`Event ${eventName} is not registered for pipeline ${this.#name}`);
        }

        const responseHandlers = this.#responseHandlers.get(eventName);
        if (responseHandlers) {
            for (const handler of responseHandlers) {
                const response = handler(data);
                if (response !== undefined) return response;
            }
        }
        return null;
    }

    /**
     * Registers a handler for one-way events.
     *
     * @param {string} eventName - Event to listen for
     * @param {Function} handler - Handler function
     * @throws {Error} If event is not registered for this pipeline
     */
    on(eventName, handler) {
        checkParams(arguments, [TYPE_CONSTANTS.STRING, TYPE_CONSTANTS.FUNCTION]);

        if (!this.#validEvents.has(eventName)) {
            throw new Error(`Event ${eventName} is not registered for pipeline ${this.#name}`);
        }

        if (!this.#handlers.has(eventName)) {
            this.#handlers.set(eventName, new Set());
        }
        this.#handlers.get(eventName).add(handler);
    }

    /**
     * Registers a handler for request-response events.
     *
     * @param {string} eventName - Event to handle requests for
     * @param {Function} handler - Handler function that returns a response
     * @throws {Error} If event is not registered for this pipeline
     */
    onRequest(eventName, handler) {
        checkParams(arguments, [TYPE_CONSTANTS.STRING, TYPE_CONSTANTS.FUNCTION]);

        if (!this.#validEvents.has(eventName)) {
            throw new Error(`Event ${eventName} is not registered for pipeline ${this.#name}`);
        }

        if (!this.#responseHandlers.has(eventName)) {
            this.#responseHandlers.set(eventName, new Set());
        }
        this.#responseHandlers.get(eventName).add(handler);
    }

    /**
     * Removes an event handler.
     *
     * @param {string} eventName - Event to remove handler from
     * @param {Function} handler - Handler to remove
     */
    off(eventName, handler) {
        checkParams(arguments, [TYPE_CONSTANTS.STRING, TYPE_CONSTANTS.FUNCTION]);

        const handlers = this.#handlers.get(eventName);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.#handlers.delete(eventName);
            }
        }
    }

    /**
      * Removes a request handler.
      *
      * @param {string} eventName - Event to remove handler from
      * @param {Function} handler - Handler to remove
      */
    offRequest(eventName, handler) {
        checkParams(arguments, [TYPE_CONSTANTS.STRING, TYPE_CONSTANTS.FUNCTION]);

        const handlers = this.#responseHandlers.get(eventName);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.#responseHandlers.delete(eventName);
            }
        }
    }

    /**
     * Makes a handler sleep.
     * A sleeping handler will not be called when an event is emitted.
     *
     * @param {Function} listener - Handler to sleep
     */
    sleep(listener) {
        checkParams(arguments, [TYPE_CONSTANTS.FUNCTION]);
        this.#sleeping.add(listener);
        return () => this.wake(listener);
    }

    wake(listener) {
        checkParams(arguments, [TYPE_CONSTANTS.FUNCTION]);
        this.#sleeping.delete(listener);
    }

    once(handler) {
        checkParams(arguments, [TYPE_CONSTANTS.FUNCTION]);
        const wrappedHandler = (data) => {
            handler(data);
            this.off(eventName, wrappedHandler);
        };
        this.on(eventName, wrappedHandler);
    }
}

export default Pipeline;