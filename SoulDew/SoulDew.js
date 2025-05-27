import { createPrivateState } from "../Utilities/FunctionUtility.js";
import { PriorityQueue } from "../Utilities/ObjectFactory.js";

/**
 * @typedef {Object} EventObject
 * @property {boolean} cancelled - Whether the event propagation has been cancelled
 * @property {function(): void} cancelEvent - Function to cancel further event propagation
 * @property {Object} context - Context object associated with the current handler
 * @property {Object} emitterContext - Emitter context object associated with the current handler
 * @property {string} listenerName - Name of the listener that emitted the event
 * @property {string} emitterName - Name of the emitter that emitted the event
 */

/**
 * @typedef {Object} HandlerOptions
 * @property {boolean} [sleeping=false] - Whether the handler is currently sleeping (disabled)
 * @property {number} [priority=0] - Priority of the handler (higher numbers execute first)
 * @property {boolean} [once=false] - Whether the handler should be removed after being called once
 * @property {Object} [metadata] - Metadata object to associate with the handler
 * @property {boolean} [metadata.performance=false] - Whether to log performance information for this handler
 * @property {string} [name] - Name of the handler
 * @property {Object} [context] - Context object to bind to the handler function
 * @property {function} [preEvent] - Function called before the event is emitted
 * @property {function} [postEvent] - Function called after the event is emitted
 * @property {function} [customPredicate] - Custom predicate function to determine if the handler should be executed
 * @property {string[]} [tags] - Tags of a filtering system to determine if a handler should be executed
 * @property {string[]} [globalPredicates] - Globl pipeline predicates to determine if the handler should be executed
 */

/**
 * @typedef {Object} EmitterOptions
 * @property {string[]} [tags] - Tags to filter the event
 * @property {function(): void} [onCancel] - Callback to execute when the event is cancelled
 * @property {Object} [context] - Context object to bind to the emitter
 * @property {string} [name] - Name of the emitter
 */

/**
 * @typedef {Object} PipelineInterface
 * @property {string} name - The name of the pipeline
 * @property {function(string, ...any): void} emit - Emits an event on this pipeline
 * @property {function(string, ...any): any} request - Sends a request to this pipeline and returns the first non-undefined response
 * @property {function(string, function(EventObject, any[]): void, HandlerOptions=): void} on - Registers an event handler for this pipeline
 * @property {function(string, function(any[]): any): void} onRequest - Registers a request handler for this pipeline
 * @property {function(string, Function): void} off - Removes an event handler from this pipeline
 * @property {function(string, Function): void} offRequest - Removes a request handler from this pipeline
 * @property {function(string, Function): void} registerPredicate - Registers a global predicate within this pipeline
 */

/**
 * @typedef {Object} PipelinesState
 * @property {function(string, string[]): PipelineInterface} createPipeline - Create a new pipeline
 * @property {function(string): Object} getPipeline - Get a pipeline by name
 * @property {function(string): void} removePipeline - Delete a pipeline by name
 * @property {function(): void} removeAllPipelines - Clears all pipelines
 */

/**
 * @typedef {Object} HandlerInterface
 * @property {Object} handler - The handler object
 * @property {function(): void} sleep - Temporarily disables the handler
 * @property {function(): void} wake - Re-enables a sleeping handler
 * @property {function(): void} off - Completely removes the handler
 */

/**
 * @type {PipelinesState}
 */
const PipelinesState = createPrivateState({ pipelines: new Map() })
    .addPublicMethods({
        createPipeline(privateState, name, validEvents) {
            if (privateState.pipelines.has(name))
                throw new Error(`Pipeline ${name} already exists`);

            privateState.pipelines.set(name, {
                name: name,
                validEvents: new Set(validEvents),
                responseHandlers: new Map(),
                predicates: new Map(),
                priorityQueue: new PriorityQueue(
                    (a, b) => b.priority - a.priority,
                ),
            });

            return {
                name,
                emit: SoulDew.emit.bind(SoulDew, name),
                request: SoulDew.request.bind(SoulDew, name),
                on: SoulDew.on.bind(SoulDew, name),
                onRequest: SoulDew.onRequest.bind(SoulDew, name),
                off: SoulDew.off.bind(SoulDew, name),
                offRequest: SoulDew.offRequest.bind(SoulDew, name),
                registerPredicate: SoulDew.registerPredicate.bind(
                    SoulDew,
                    name,
                ),
            };
        },
        getPipeline(privateState, name) {
            if (!privateState.pipelines.has(name))
                throw new Error(`Pipeline ${name} does not exist`);
            return privateState.pipelines.get(name);
        },
        removePipeline(privateState, name) {
            privateState.pipelines.delete(name);
        },
        removeAllPipelines(privateState) {
            privateState.pipelines.clear();
        },
    })
    .build();

const SOULDEW_STATE = Object.seal({
    pipelines: PipelinesState,
});

/**
 * SoulDew event pipeline system. A highly efficient event system that uses
 * the philosophical concept of "pipelines", aka groups of events that can be
 * emitted and listened to. The pipelines concept is created to facilitate
 * controlled, explicit communication between different parts of the system.
 *
 * The usage of pipelines provides an effective solution for modular event emitting
 * and preventing event spaghettification. Each pipeline represents a dedicated
 * communication channel with a strictly defined set of events that can occur on it.
 * Several utilities are provided for your convenience.
 *
 * @namespace
 */
const SoulDew = Object.freeze({
    createPipeline: SOULDEW_STATE.pipelines.createPipeline,
    getPipeline: SOULDEW_STATE.pipelines.getPipeline,
    removePipeline: SOULDEW_STATE.pipelines.removePipeline,
    removeAllPipelines: SOULDEW_STATE.pipelines.removeAllPipelines,

    /**
     * Emits an event on a specific pipeline
     *
     * When an event is emitted, all registered handlers for that event on the specified
     * pipeline will be called in order of priority (highest to lowest). Each handler
     * receives an event object and the data passed to the emit method.
     *
     * @param {string} pipelineName - Name of the pipeline
     * @param {string} eventName - Name of the event to emit
     * @param {any} data - Data to pass to event handlers
     * @param {EmitterOptions} options - Options for the emitter
     * @throws {Error} If event is not registered for the pipeline
     *
     * @todo Consider refactoring this method to use a plugin registry for cleanup
     * and robustness. This would allow for better management of event handlers and
     * their associated metadata.
     */
    emit(pipelineName, eventName, data, options = {}) {
        const pipeline = this.getPipeline(pipelineName);
        if (!pipeline.validEvents.has(eventName))
            throw new Error(
                `Event ${eventName} is not registered for pipeline ${pipeline.name}`,
            );

        const emitTags = options.tags ?? [];
        const onCancel = options.onCancel ?? null;
        const emitterContext = options.context ?? {};
        const emitterName = options.name ?? "";

        const eventObject = {
            cancelled: false,
            listenerName: "",
            emitterName,
            cancelEvent() {
                this.cancelled = true;
                onCancel?.();
            },
            context: {},
            emitterContext,
        };

        pipeline.priorityQueue.processQueue(
            (handler) => {
                if (handler.eventName !== eventName) return;

                if (eventObject.cancelled) return;
                if (handler.sleeping) return;
                if (emitTags.length > 0) {
                    if (
                        handler.tags.length > 0 &&
                        !handler.tags.some((tag) => emitTags.includes(tag))
                    )
                        return;
                }

                eventObject.context = handler.context;
                eventObject.listenerName = handler.name;

                try {
                    if (
                        handler.customPredicate &&
                        !handler.customPredicate(eventObject, data)
                    )
                        return;

                    if (
                        handler.globalPredicates &&
                        Object.keys(handler.globalPredicates).length > 0
                    ) {
                        for (const [
                            predicateName,
                            predicateParam,
                        ] of Object.entries(handler.globalPredicates)) {
                            const predicate =
                                pipeline.predicates.get(predicateName);
                            if (!predicate) continue;

                            if (
                                !predicate.callback(
                                    eventObject,
                                    data,
                                    predicateParam,
                                )
                            ) {
                                return;
                            }
                        }
                    }

                    handler.preEvent?.(eventObject, data);
                    if (eventObject.cancelled) return;

                    let t1;
                    if (handler.metadata.performance) t1 = performance.now();
                    handler.callback(eventObject, data);

                    if (handler.metadata.performance) {
                        eventObject.context.metrics = {
                            duration: performance.now() - (t1 ?? 0),
                        };
                    }

                    handler.postEvent?.(eventObject, data);
                    if (handler.once) this.off(pipelineName, handler);
                } catch (error) {
                    console.error(
                        `Error in handler for event ${eventName} in pipeline ${pipeline.name}:`,
                        error,
                    );
                }
            },
            {
                preserveItems: true,
            },
        );
    },

    /**
     * Sends a request to a pipeline and returns the first non-undefined response
     *
     * Unlike emit which triggers all handlers, request stops at the first handler
     * that returns a non-undefined value and returns that value.
     *
     * @param {string} pipelineName - Name of the pipeline
     * @param {string} eventName - Name of the event to request
     * @param {...any} data - Data to pass to response handlers
     * @returns {any} The first non-undefined response or null if none
     *
     * @example
     * // Request user data and get the first valid response
     * const userData = SoulDew.request('users', 'getUserData', 123);
     */
    request(pipelineName, eventName, ...data) {
        const pipeline = this.getPipeline(pipelineName);
        const responseHandlers = pipeline.responseHandlers.get(eventName);
        if (responseHandlers) {
            for (const handler of responseHandlers) {
                const response = handler(data);
                if (response !== undefined) return response;
            }
        }
        return null;
    },

    /**
     * Registers an event handler for a specific pipeline and event
     *
     * The handler function receives two parameters:
     * 1. An event object with properties like `cancelled` and methods like `cancelEvent()`
     * 2. An array containing all data passed to the emit call
     *
     * @param {string} pipelineName - Name of the pipeline
     * @param {string} eventName - Name of the event to listen for
     * @param {function(EventObject, any[]): void} callback - Callback to execute when event is emitted
     * @param {HandlerOptions} [options] - Options for the handler
     * @throws {Error} If event is not registered for the pipeline
     * @returns {HandlerInterface} An interface with methods to control the handler.
     *
     * @example
     * ```js
     * // Register a handler for 'userLoggedIn' events with high priority
     * const handlerControl = SoulDew.on('auth', 'userLoggedIn', (event, [userData]) => {
     *   console.log(`User logged in: ${userData.username}`);
     *   if (userData.isBanned) {
     *     event.cancelEvent(); // Prevent other handlers from processing this login
     *   }
     * }, { priority: 10, metadata: { performance: true } });
     * ```
     */
    on(pipelineName, eventName, callback, options = {}) {
        const pipeline = this.getPipeline(pipelineName);
        if (!pipeline.validEvents.has(eventName))
            throw new Error(
                `Event ${eventName} is not registered for pipeline ${pipeline.name}`,
            );

        const handler = {
            callback,
            eventName,
            sleeping: false,
            priority: options.priority ?? 0,
            once: options.once ?? false,
            metadata: options.metadata ?? {},
            name: options.name ?? "anonymous",
            context: options.context ?? {},
            preEvent: options.preEvent ?? null,
            postEvent: options.postEvent ?? null,
            customPredicate: options.customPredicate ?? null,
            tags: options.tags ?? [],
            globalPredicates: options.globalPredicates ?? [],
        };

        pipeline.priorityQueue.enqueue(handler);

        return {
            handler,
            sleep: () => (handler.sleeping = true),
            wake: () => (handler.sleeping = false),
            off: () => pipeline.off(handler),
        };
    },

    /**
     * Registers a request handler for a specific pipeline and event
     *
     * The handler function receives an array of data passed to the request method
     * and should return a value if it can handle the request, or undefined to allow
     * other handlers to process it.
     *
     * @param {string} pipelineName - Name of the pipeline
     * @param {string} eventName - Name of the event to handle requests for
     * @param {function(any[]): any} handler - Handler function that receives request data and returns a response
     * @throws {Error} If event is not registered for the pipeline
     *
     * @example
     * // Register a handler that responds to getUserData requests
     * SoulDew.onRequest('users', 'getUserData', ([userId]) => {
     *   if (userId === 123) {
     *     return { id: 123, name: 'Example User', role: 'admin' };
     *   }
     *   // Return undefined to let other handlers try to handle this request
     * });
     */
    onRequest(pipelineName, eventName, handler) {
        const pipeline = this.getPipeline(pipelineName);
        if (!pipeline.validEvents.has(eventName))
            throw new Error(
                `Event ${eventName} is not registered for pipeline ${pipeline.name}`,
            );

        if (!pipeline.responseHandlers.has(eventName)) {
            pipeline.responseHandlers.set(eventName, new Set());
        }

        const handlers = pipeline.responseHandlers.get(eventName);
        handlers?.add(handler);
    },

    /**
     * Removes an event handler from a specific pipeline and event
     * @param {string} pipelineName - Name of the pipeline
     * @param {Function} handler - Handler object to remove
     */
    off(pipelineName, handler) {
        const pipeline = this.getPipeline(pipelineName);
        pipeline.priorityQueue.delete(handler);
    },

    /**
     * Removes a request handler from a specific pipeline and event
     * @param {string} pipelineName - Name of the pipeline
     * @param {string} eventName - Name of the event
     * @param {Function} handler - Handler function to remove
     */
    offRequest(pipelineName, eventName, handler) {
        const pipeline = this.getPipeline(pipelineName);

        const handlers = pipeline.responseHandlers.get(eventName);
        handlers.delete(handler);

        if (handlers.length === 0) {
            pipeline.handlers.delete(eventName);
        }
    },

    /**
     * Registers a global predicate within a specific pipeline.
     * @param {string} pipelineName - Name of the pipeline
     * @param {Function} predicate - A callback serving as the predicate
     */
    registerPredicate(pipelineName, predicate) {
        const pipeline = this.getPipeline(pipelineName);
        pipeline.predicates.set(predicate.name, predicate);
    },
});

export default SoulDew;
