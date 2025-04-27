import {
    createPrivateState,
    defineStruct,
} from "../Utilities/ObjectFactory.js";

const Pipeline = defineStruct({
    name: String,
    validEvents: Set,
    handlers: Map,
    responseHandlers: Map,
    sleeping: Set,
});

const PipelineInterface = defineStruct({
    name: String,
    emit: Function,
    request: Function,
    on: Function,
    onRequest: Function,
    off: Function,
    offRequest: Function,
});

/**
 * @typedef {Object} PipelinesState
 * @property {function(string, string[]): Object} createPipeline - Create a new pipeline.
 * @property {function(string): Object} getPipeline - Get a pipeline by name.
 * @property {function(string): void} removePipeline - Delete a pipeline by name.
 * @property {function(string): void} removeAllPipelines - Clears all pipelines.
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
                once: SoulDew.once.bind(SoulDew, name),
                sleep: SoulDew.sleep.bind(SoulDew, name),
                wake: SoulDew.wake.bind(SoulDew, name),
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
 * the philsophical concept of "pipelines", aka groups of events that can be
 * emitted and listened to. The pipelines concept is created to facilitate
 * controlled, explicit communication between different parts of the system.
 * The usage of pipelines provides an effective solution for modular event emitting
 * and to preventing event spaghettification. Several utilities are provided
 * for your convenience.
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
     * @param {string} pipelineName - Name of the pipeline
     * @param {string} eventName - Name of the event to emit
     * @param {...any} data - Data to pass to event handlers
     * @throws {Error} If event is not registered for the pipeline
     */
    emit(pipelineName, eventName, ...data) {
        const pipeline = this.getPipeline(pipelineName);
        if (!pipeline.validEvents.has(eventName))
            throw new Error(
                `Event ${eventName} is not registered for pipeline ${pipeline.name}`,
            );

        const handlers = pipeline.handlers.get(eventName);
        if (handlers) {
            // I'd love to make this a struct, but it absolutely kills performance.
            const eventObject = {
                cancelled: false,
                cancel() {
                    this.cancelled = true;
                    console.log("Event cancelled");
                },
            };

            for (const handler of handlers) {
                if (pipeline.sleeping.has(handler)) continue;
                if (eventObject.cancelled) break;
                try {
                    handler(eventObject, data);
                } catch (error) {
                    console.error(
                        `Error in handler for event ${eventName} in pipeline ${pipeline.name}:`,
                        error,
                    );
                }
            }
        }
    },

    /**
     * Sends a request to a pipeline and returns the first non-undefined response
     * @param {string} pipelineName - Name of the pipeline
     * @param {string} eventName - Name of the event to request
     * @param {...any} data - Data to pass to response handlers
     * @returns {any} The first non-undefined response or null if none
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
     * @param {string} pipelineName - Name of the pipeline
     * @param {string} eventName - Name of the event to listen for
     * @param {Function} handler - Handler function to call when event is emitted
     * @throws {Error} If event is not registered for the pipeline
     */
    on(pipelineName, eventName, handler) {
        const pipeline = this.getPipeline(pipelineName);
        if (!pipeline.validEvents.has(eventName))
            throw new Error(
                `Event ${eventName} is not registered for pipeline ${pipeline.name}`,
            );

        if (!pipeline.handlers.has(eventName)) {
            pipeline.handlers.set(eventName, new Set());
        }

        const handlers = pipeline.handlers.get(eventName);
        handlers?.add(handler);
    },

    /**
     * Registers a request handler for a specific pipeline and event
     * @param {string} pipelineName - Name of the pipeline
     * @param {string} eventName - Name of the event to handle requests for
     * @param {Function} handler - Handler function to call when request is made
     * @throws {Error} If event is not registered for the pipeline
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
            handlers.delete(handler);
            if (handlers.size === 0) {
                pipeline.handlers.delete(eventName);
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
            handlers.delete(handler);
            if (handlers.size === 0) {
                pipeline.responseHandlers.delete(eventName);
            }
        }
    },

    /**
     * Puts a listener to sleep (temporarily disables it)
     * @param {string} pipelineName - Name of the pipeline
     * @param {Function} listen - Listener function to put to sleep
     * @returns {Function} Function to wake the listener
     */
    sleep(pipelineName, listen) {
        const pipeline = this.getPipeline(pipelineName);
        pipeline.sleeping.add(listen);
        return () => this.wake(pipelineName, listen);
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

    /**
     * Registers a one-time event handler for a specific pipeline and event
     * @param {string} pipelineName - Name of the pipeline
     * @param {string} eventName - Name of the event to listen for once
     * @param {Function} handler - Handler function to call when event is emitted
     */
    once(pipelineName, eventName, handler) {
        const listen = (data) => {
            handler(data);
            this.off(pipelineName, eventName, listen);
        };

        this.on(pipelineName, eventName, listen);
    },
});

export default SoulDew;
