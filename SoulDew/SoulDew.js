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
    /**
     * Creates a pipeline via the child-factory relationship. These children are expected
     * to be stored somewhere within the codebase, and are automatically passed when
     * using the returned interface.
     *
     * @param {string} name - The expected name of the pipeline
     * @param {Array<String>} validEvents - The valid events that the pipeline can emit
     * @returns {PipelineInterface} The pipeline interface with bound methods
     */
    createPipeline(name, validEvents) {
        const pipeline = {
            name: name,
            validEvents: new Set(validEvents),
            responseHandlers: new Map(),
            predicates: new Map(),
            listeners: new Map(),
        };

        return {
            name,
            emit: SoulDew.emit.bind(SoulDew, pipeline),
            request: SoulDew.request.bind(SoulDew, pipeline),
            on: SoulDew.on.bind(SoulDew, pipeline),
            onRequest: SoulDew.onRequest.bind(SoulDew, pipeline),
            off: SoulDew.off.bind(SoulDew, pipeline),
            offRequest: SoulDew.offRequest.bind(SoulDew, pipeline),
            registerPredicate: SoulDew.registerPredicate.bind(
                SoulDew,
                pipeline,
            ),
        };
    },

    /**
     * Emits an event on a specific pipeline
     *
     * When an event is emitted, all registered handlers for that event on the specified
     * pipeline will be called in order of priority (highest to lowest). Each handler
     * receives an event object and the data passed to the emit method.
     *
     * @param {PipelineState} pipeline - State of the pipeline
     * @param {string} eventName - Name of the event to emit
     * @param {Object} data - Data to pass to event handlers
     * @param {EmitterOptions} options - Options for the emitter
     * @throws {Error} If event is not registered for the pipeline
     *
     * @todo Consider refactoring this method to use a plugin registry for cleanup
     * and robustness. This would allow for better management of event handlers and
     * their associated metadata.
     */
    emit(pipeline, eventName, data, options = {}) {
        if (!pipeline.validEvents.has(eventName)) {
            throw new Error(
                `Event ${eventName} is not registered for pipeline ${pipeline.name}`,
            );
        }

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

        const handlers = pipeline.listeners.get(eventName);
        if (!handlers)
            throw new Error(
                `No handlers for event ${eventName} in pipeline ${pipeline.name}`,
            );

        for (const handler of handlers) {
            if (eventObject.cancelled) break;
            if (handler.sleeping) continue;
            if (emitTags.length > 0) {
                if (
                    handler.tags.length > 0 &&
                    !handler.tags.some((tag) => emitTags.includes(tag))
                )
                    continue;
            }

            eventObject.context = handler.context;
            eventObject.listenerName = handler.name;

            try {
                if (
                    handler.customPredicate &&
                    !handler.customPredicate(eventObject, data)
                )
                    continue;

                if (
                    handler.globalPredicates &&
                    Object.keys(handler.globalPredicates).length > 0
                ) {
                    let shouldSkip = false;
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
                            shouldSkip = true;
                            break;
                        }
                    }
                    if (shouldSkip) continue;
                }

                handler.preEvent?.(eventObject, data);
                if (eventObject.cancelled) break;

                let t1;
                if (handler.metadata.performance) t1 = performance.now();
                handler.callback(eventObject, data);

                if (handler.metadata.performance) {
                    eventObject.context.metrics = {
                        duration: performance.now() - (t1 ?? 0),
                    };
                }

                handler.postEvent?.(eventObject, data);
                if (handler.once) this.off(pipeline, handler);
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
     * @param {PipelineState} pipeline - State of the pipeline
     * @param {string} eventName - Name of the event to request
     * @param {...any} data - Data to pass to response handlers
     * @returns {any} The first non-undefined response or null if none
     *
     * @example
     * // Request user data and get the first valid response
     * const userData = SoulDew.request('users', 'getUserData', 123);
     */
    request(pipeline, eventName, ...data) {
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
     * @param {PipelineState} pipeline - State of the pipeline
     * @param {string} eventName - Name of the event to listen for
     * @param {function(EventObject, any[]): void} callback - Callback to execute when event is emitted
     * @param {HandlerOptions} [options] - Options for the handler
     * @throws {Error} If event is not registered for the pipeline
     * @returns {HandlerInterface} An interface with methods to control the handler.
     *
     * @example
     * ```js
     * // Register a handler for 'userLoggedIn' events with high priority
     * const authPipeline = SoulDew.createPipeline("Authentication", ["userLoggedIn"]);
     * const handlerControl = authPipeline.on('auth', 'userLoggedIn', (event, [userData]) => {
     *     console.log(`User logged in: ${userData.username}`);
     *     if (userData.isBanned) event.cancelEvent(); // Prevent other handlers from processing this login
     * }, { priority: 10, metadata: { performance: true } });
     * ```
     */
    on(pipeline, eventName, callback, options = {}) {
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
            globalPredicates: options.globalPredicates ?? null,
        };

        if (!pipeline.listeners.has(eventName)) {
            pipeline.listeners.set(eventName, []);
        }

        if (!pipeline.listeners.has(eventName)) {
            pipeline.listeners.set(eventName, []);
        }

        const handlers = pipeline.listeners.get(eventName);
        if (!handlers)
            throw new Error("Unexpected error: handlers should exist");

        return {
            handler,
            sleep: () => (handler.sleeping = true),
            wake: () => (handler.sleeping = false),
            off: () => SoulDew.off(pipeline, handler),
        };
    },

    /**
     * Registers a request handler for a specific pipeline and event
     *
     * The handler function receives an array of data passed to the request method
     * and should return a value if it can handle the request, or undefined to allow
     * other handlers to process it.
     *
     * @param {PipelineState} pipeline - State of the pipeline
     * @param {string} eventName - Name of the event to handle requests for
     * @param {function(any[]): any} handler - Handler function that receives request data and returns a response
     * @throws {Error} If event is not registered for the pipeline
     *
     * @example
     * // Register a handler that responds to getUserData requests
     * SoulDew.onRequest('users', 'getUserData', ([userId]) => {
     *     if (userId === 123) return { id: 123, name: 'Example User', role: 'admin' };
     *     // Return undefined to let other handlers try to handle this request
     * });
     */
    onRequest(pipeline, eventName, handler) {
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
     * @param {PipelineState} pipeline - State of the pipeline
     * @param {Handler} handler - Handler object to remove
     */
    off(pipeline, handler) {
        const handlers = pipeline.listeners.get(handler.eventName);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    },

    /**
     * Removes a request handler from a specific pipeline and event
     * @param {PipelineState} pipeline - State of the pipeline
     * @param {string} eventName - Name of the event
     * @param {Function} handler - Handler function to remove
     */
    offRequest(pipeline, eventName, handler) {
        const handlers = pipeline.responseHandlers.get(eventName);
        if (handlers) {
            handlers.delete(handler);

            if (handlers.size === 0) {
                pipeline.responseHandlers.delete(eventName);
            }
        }
    },

    /**
     * Registers a global predicate within a specific pipeline.
     *
     * A global predicate is different from a local predicate in the sense that it,
     * when configured to do so, checks all listeners with the same predicate.
     * Use global predicates when you find that a certain predicate is not specialised
     * and can be applied universally.
     *
     * @param {PipelineState} pipeline - State of the pipeline
     * @param {Function} predicate - A callback serving as the predicate
     * @todo Add validation via JSDoc and runtime checking.
     */
    registerPredicate(pipeline, predicate) {
        pipeline.predicates.set(predicate.name, predicate);
    },
});

export default SoulDew;
