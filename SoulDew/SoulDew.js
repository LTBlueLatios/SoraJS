import {
    createPrivateState,
    createStruct,
    // createPriorityQueue,
} from "../Utilities/ObjectFactory.js";

const Pipeline = createStruct({
    name: String,
    validEvents: Set,
    handlers: Map,
    responseHandlers: Map,
    sleeping: Set,
});

// const EVENT_PRIORITY = Object.freeze({
//     IMPORTANT: 4,
//     ELEVATED: 3,
//     NORMAL: 2,
//     DISCREET: 1,
//     BACKGROUND: 0,
// });

/**
 * @typedef {Object} EventObject
 * @property {boolean} cancelled - Whether the event propagation has been cancelled
 * @property {function(): void} cancelEvent - Function to cancel further event propagation
 * @property {Object} context - Context object associated with the current handler
 * @property {Object} emitter - Emitter context object associated with the current handler
 * @property {string} listenerName - Name of the listener that emitted the event
 * @property {string} emitterName - Name of the emitter that emitted the event
 */

/**
 * @typedef {Object} HandlerOptions
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
 * Interface for interacting with a pipeline
 * @typedef {Object} PipelineInterface
 * @property {string} name - The name of the pipeline
 * @property {function(string, ...any): void} emit - Emits an event on this pipeline
 * @property {function(string, ...any): any} request - Sends a request to this pipeline and returns the first non-undefined response
 * @property {function(string, function(EventObject, any[]): void, HandlerOptions=): void} on - Registers an event handler for this pipeline
 * @property {function(string, function(any[]): any): void} onRequest - Registers a request handler for this pipeline
 * @property {function(string, Function): void} off - Removes an event handler from this pipeline
 * @property {function(string, Function): void} offRequest - Removes a request handler from this pipeline
 * @property {function(Function): Function} sleep - Puts a listener to sleep (temporarily disables it)
 * @property {function(Function): void} wake - Wakes a sleeping listener
 */

const PipelineInterface = createStruct({
    name: String,
    emit: Function,
    request: Function,
    on: Function,
    onRequest: Function,
    off: Function,
    offRequest: Function,
    sleep: Function,
    wake: Function,
});

/**
 * @typedef {Object} PipelinesState
 * @property {function(string, string[]): PipelineInterface} createPipeline - Create a new pipeline
 * @property {function(string): Object} getPipeline - Get a pipeline by name
 * @property {function(string): void} removePipeline - Delete a pipeline by name
 * @property {function(): void} removeAllPipelines - Clears all pipelines
 */

/**
 * @type {PipelinesState}
 */
const PipelinesState = createPrivateState({ pipelines: new Map() })
    .addPublicMethods({
        createPipeline(privateState, name, validEvents) {
            if (privateState.pipelines.has(name))
                throw new Error(`Pipeline ${name} already exists`);

            const pipeline = Pipeline.spawn({
                name: name,
                validEvents: new Set(validEvents),
                handlers: new Map(),
                responseHandlers: new Map(),
                sleeping: new Set(),
                predicates: new Map(),
            });
            privateState.pipelines.set(name, pipeline);

            return PipelineInterface.spawn({
                name,
                emit: SoulDew.emit.bind(SoulDew, name),
                request: SoulDew.request.bind(SoulDew, name),
                on: SoulDew.on.bind(SoulDew, name),
                onRequest: SoulDew.onRequest.bind(SoulDew, name),
                off: SoulDew.off.bind(SoulDew, name),
                offRequest: SoulDew.offRequest.bind(SoulDew, name),
                sleep: SoulDew.sleep.bind(SoulDew, name),
                wake: SoulDew.wake.bind(SoulDew, name),
                registerPredicate: SoulDew.registerPredicate.bind(
                    SoulDew,
                    name,
                ),
            });
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
 * and prevents event spaghettification. Each pipeline represents a dedicated
 * communication channel with a strictly defined set of events that can occur on it.
 *
 * @namespace
 */
const SoulDew = Object.freeze({
    createPipeline: SOULDEW_STATE.pipelines.createPipeline,
    getPipeline: SOULDEW_STATE.pipelines.getPipeline,
    removePipeline: SOULDEW_STATE.pipelines.removePipeline,
    removeAllPipelines: SOULDEW_STATE.pipelines.removeAllPipelines,
    // Making this flush with the event system is a really massive change
    // to make. I am no position to do so until the rest of the system is complete.
    // priorityQueue: createPriorityQueue(EVENT_PRIORITY),

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
     * @param {object} options - Options for the emitter
     * @throws {Error} If event is not registered for the pipeline
     *
     * @example
     * // Emit a 'userLoggedIn' event with a user object
     * SoulDew.emit('auth', 'userLoggedIn', { id: 123, username: 'exampleUser' });
     *
     */
    emit(pipelineName, eventName, data, options = {}) {
        const pipeline = this.getPipeline(pipelineName);
        if (!pipeline.validEvents.has(eventName))
            throw new Error(
                `Event ${eventName} is not registered for pipeline ${pipeline.name}`,
            );

        const handlers = pipeline.handlers.get(eventName);
        if (!handlers || handlers.length === 0) return;
        const emitTags = options.tags ?? [];
        const onCancel = options.onCancel ?? null;
        const emitterContext = options.context ?? {};
        const emitterName = options.name ?? "";

        // I'd love to make this a struct, but it absolutely kills performance.
        const eventObject = {
            cancelled: false,
            listenerName: "",
            // At this point I'm just trolling lol
            // the hell will this ever be needed?
            emitterName,
            cancelEvent() {
                this.cancelled = true;
                onCancel?.(eventObject);
            },
            context: {},
            emitterContext,
        };

        // console.log(this.priorityQueue.getAllTasks());

        for (const handler of handlers) {
            if (eventObject.cancelled) break;
            if (pipeline.sleeping.has(handler.callback)) continue;
            if (emitTags.length > 0) {
                if (!handler.tags && !(handler.tags.length > 0)) continue;
                const hasMatchingTag = handler.tags.some((tag) =>
                    emitTags.includes(tag),
                );
                if (!hasMatchingTag) continue;
            }

            eventObject.context = handler.context;
            eventObject.listenerName = handler.name;

            try {
                if (
                    handler.customPredicate &&
                    !handler.customPredicate(eventObject, data)
                )
                    continue;

                // TODO: Optimise this!
                if (
                    handler.globalPredicates &&
                    handler.globalPredicates.length > 0
                ) {
                    const predicates = handler.globalPredicates.map(
                        (predicate) => {
                            return pipeline.predicates.get(predicate);
                        },
                    );
                    const predicateResults = predicates.map((predicate) =>
                        predicate.callback(eventObject, data),
                    );
                    if (!predicateResults.every((result) => result)) continue;
                }

                handler.preEvent?.(eventObject, data);
                // Handle cancellation when called by the handler's preEvent
                if (eventObject.cancelled) continue;

                let t1;
                if (handler.metadata.performance) t1 = performance.now();
                handler.callback(eventObject, data);

                if (handler.metadata.performance) {
                    eventObject.context.metrics = {
                        duration: performance.now() - (t1 ?? 0),
                    };
                }

                handler.postEvent?.(eventObject, data);
                if (handler.once) this.off(pipelineName, eventName, handler);
            } catch (error) {
                console.error(
                    `Error in handler for event ${eventName} in pipeline ${pipeline.name}:`,
                    error,
                );
            }
        }
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
     *
     * @example
     * ```js
     * // Register a handler for 'userLoggedIn' events with high priority
     * SoulDew.on('auth', 'userLoggedIn', (event, [userData]) => {
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

        if (!pipeline.handlers.has(eventName)) {
            pipeline.handlers.set(eventName, []);
        }

        const handlers = pipeline.handlers.get(eventName);
        const handler = {
            callback,
            priority: options.priority ?? 0,
            once: options.once ?? false,
            metadata: options.metadata ?? {},
            name: options.name ?? "anonymous",
            context: options.context ?? {},
            preEvent: options.preEvent ?? null,
            postEvent: options.postEvent ?? null,
            customPredicate: options.customPredicate ?? null,
            globalPredicates: options.globalPredicates ?? [],
            tags: options.tags ?? [],
        };

        handlers.push(handler);
        // this.priorityQueue.addTask(handler);

        // Hotfix: Sort by array
        handlers.sort((a, b) => b.priority - a.priority);
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
     * @param {string} eventName - Name of the event
     * @param {Function} handler - Handler function to remove
     */
    off(pipelineName, eventName, handler) {
        const pipeline = this.getPipeline(pipelineName);

        const handlers = pipeline.handlers.get(eventName);
        if (handlers) {
            const index = handlers.findIndex((h) => h.callback === handler);

            if (index > -1) {
                handlers.splice(index, 1);
                if (handlers.length === 0) {
                    pipeline.handlers.delete(eventName);
                }
            }
        }
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
        if (handlers) {
            const index = handlers.findIndex((h) => h.callback === handler);

            if (index > -1) {
                handlers.splice(index, 1);
                if (handlers.length === 0) {
                    pipeline.responseHandlers.delete(eventName);
                }
            }
        }
    },

    /**
     * Puts a listener to sleep (temporarily disables it)
     * @param {string} pipelineName - Name of the pipeline
     * @param {Function} listen - Listener function to put to sleep
     */
    sleep(pipelineName, listen) {
        const pipeline = this.getPipeline(pipelineName);
        pipeline.sleeping.add(listen);
    },

    /**
     * Wakes a sleeping listener
     * @param {string} pipelineName - Name of the pipeline
     * @param {Function} listen - Listener function to wake
     */
    wake(pipelineName, listen) {
        const pipeline = this.getPipeline(pipelineName);
        pipeline.sleeping.delete(listen);
    },

    registerPredicate(pipelineName, predicate) {
        const pipeline = this.getPipeline(pipelineName);
        pipeline.predicates.set(predicate.name, predicate);
    },
});

export default SoulDew;
