import { checkParams, TYPE_CONSTANTS } from "../Utilities/CheckType.js";

/**
 *
 * @template T - Type of data passed through the pipeline
 * @template [R=any] - Type of data returned by request handlers
 *
 * @abstract
 *
 * Pipeline is responsible for all data communications and event
 * handling within `SoulDew`. This class should never be exported and used
 * on its own.
 *
 * Each created pipeline instance is an isolated instance that has no
 * knowledge of anything outside of it.
 *
 * @todo Custom Emitters, Priority Queue
 * @todo Predicates
 * @todo [Complex] Multi-threaded handlers
 * @todo [Complex] Event batching and processing
 */
class Pipeline {
    /**
     *
    * @typedef {import('./types.js').EventHandler<T>} EventHandler
    * @typedef {import('./types.js').RequestHandler<T, R>} RequestHandler
    * @typedef {import('./types.js').EmitOptions} EmitOptions
     */
    /** @type {string} */
    #name;
    /** @type {Set<string>} */
    #validEvents;
    /** @type {Map<string, Set<import('./types.js').EventHandler<T>>>} */
    #handlers = new Map();
    /** @type {Map<string, Set<import('./types.js').RequestHandler<T, R>>>} */
    #responseHandlers = new Map();
    /** @type {Set<import('./types.js').EventHandler<T> | import('./types.js').RequestHandler<T, R>>} */
    #sleeping = new Set();

    /**
     * Creates a new Pipeline instance
     * @param {string} name - Name of the pipeline
     * @param {string[]} validEvents - List of valid event names
     * @throws {Error} If name is empty or validEvents is empty
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
     * @param {string} eventName - Name of the event to emit
     * @param {T} data - Data to pass to handlers
     * @param {import('./types.js').EmitOptions} [options={}] - Configuration options for the emit operation
     * @returns {boolean|void} Returns boolean if requiresAcknowledgement is true
     * @throws {Error} If event is not registered for this pipeline
     */
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
     * @param {T} data - Data to pass to handlers
     * @returns {R|null} Response from the first handler that returns a non-undefined value
     * @throws {Error} If event is not registered for this pipeline
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
     * @param {EventHandler} handler - Handler function
     * @throws {Error} If event is not registered for this pipeline
     * @returns {void}
     */
    on(eventName, handler) {
        checkParams(arguments, [TYPE_CONSTANTS.STRING, TYPE_CONSTANTS.FUNCTION]);

        if (!this.#validEvents.has(eventName)) {
            throw new Error(`Event ${eventName} is not registered for pipeline ${this.#name}`);
        }

        if (!this.#handlers.has(eventName)) {
            this.#handlers.set(eventName, new Set());
        }

        const handlers = this.#handlers.get(eventName);
        if (handlers) {
            handlers.add(handler);
        }
    }


    /**
     * Registers a handler for request-response events.
     *
     * @param {string} eventName - Event to handle requests for
     * @param {RequestHandler} handler - Handler function that returns a response
     * @throws {Error} If event is not registered for this pipeline
     * @returns {void}
     */
    onRequest(eventName, handler) {
        checkParams(arguments, [TYPE_CONSTANTS.STRING, TYPE_CONSTANTS.FUNCTION]);

        if (!this.#validEvents.has(eventName)) {
            throw new Error(`Event ${eventName} is not registered for pipeline ${this.#name}`);
        }

        if (!this.#responseHandlers.has(eventName)) {
            this.#responseHandlers.set(eventName, new Set());
        }

        const handlers = this.#handlers.get(eventName);
        if (handlers) {
            handlers.add(handler);
        }
    }

    /**
     * Removes an event handler.
     *
     * @param {string} eventName - Event to remove handler from
     * @param {EventHandler} handler - Handler to remove
     * @returns {void}
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
     * @param {RequestHandler} handler - Handler to remove
     * @returns {void}
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
     * @param {EventHandler | RequestHandler} listener - Handler to sleep
     * @returns {() => void} Function to wake up the handler
     */
    sleep(listener) {
        checkParams(arguments, [TYPE_CONSTANTS.FUNCTION]);
        this.#sleeping.add(listener);
        return () => this.wake(listener);
    }

    /**
     * Wakes up a sleeping listener.
     *
     * @param {EventHandler | RequestHandler} listener - Handler to wake
     * @returns {void}
     */
    wake(listener) {
        checkParams(arguments, [TYPE_CONSTANTS.FUNCTION]);
        this.#sleeping.delete(listener);
    }

    /**
     * Attaches a handler that is triggered once then deleted.
     *
     * @param {string} eventName - Event to listen for once
     * @param {EventHandler} handler - One-time handler function
     * @throws {Error} If event is not registered for this pipeline
     * @returns {void}
     */
    once(eventName, handler) {
        checkParams(arguments, [TYPE_CONSTANTS.STRING, TYPE_CONSTANTS.FUNCTION]);

        /**
         * @param {*} data
         */
        const wrappedHandler = (data) => {
            handler(data);
            this.off(eventName, wrappedHandler);
        };

        this.on(eventName, wrappedHandler);
    }
}

export default Pipeline;