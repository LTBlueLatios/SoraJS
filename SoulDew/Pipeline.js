import { checkParams, TYPE_CONSTANTS } from "../Utilities/CheckType.js";

/**
 * @class
 */
class Pipeline {
    #name;
    #validEvents;
    #handlers = new Map();
    #responseHandlers = new Map();

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
     * @throws {Error} If event is not registered for this pipeline
     */
    emit(eventName, data) {
        checkParams(arguments, [TYPE_CONSTANTS.STRING, TYPE_CONSTANTS.ANY]);

        if (!this.#validEvents.has(eventName)) {
            throw new Error(`Event ${eventName} is not registered for pipeline ${this.#name}`);
        }

        const handlers = this.#handlers.get(eventName);
        if (handlers) {
            for (const handler of handlers) {
                handler(data);
            }
        }
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
}

export default Pipeline;