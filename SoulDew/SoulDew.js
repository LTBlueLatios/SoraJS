import { checkParams } from "../Utilities/CheckType.js";
import { PRIMITIVE_TYPE_CONSTANTS } from "../Utilities/TypeConstants.js";

import { createPrivateState } from "../Utilities/ObjectFactory.js";

const PipelinesObject = createPrivateState()
    .addPrivateProperty("pipelines", new Map())
    .addPublicMethod("createPipeline", (privateState, name, validEvents) => {
        if (privateState.pipelines.has(name)) throw new Error(`Pipeline ${name} already exists`);

        privateState.pipelines.set(name, {
            name,
            validEvents: new Set(validEvents),
            handlers: new Map(),
            responseHandlers: new Map(),
            sleeping: new Set()
        });

        return {
            name,
            emit: (eventName, data) => SoulDew.emit(name, eventName, data),
            request: (eventName, data) => SoulDew.request(name, eventName, data),
            on: (eventName, handler) => SoulDew.on(name, eventName, handler),
            onRequest: (eventName, handler) => SoulDew.onRequest(name, eventName, handler),
            off: (eventName, handler) => SoulDew.off(name, eventName, handler),
            offRequest: (eventName, handler) => SoulDew.offRequest(name, eventName, handler),
            once: (eventName, handler) => SoulDew.once(name, eventName, handler),
            sleep: (listen) => SoulDew.sleep(name, listen),
            wake: (listen) => SoulDew.wake(name, listen),
        }
    })
    .addPublicMethod("getPipeline", (privateState, name) => {
        if (!privateState.pipelines.has(name)) throw new Error(`Pipeline ${name} does not exist`);
        return privateState.pipelines.get(name);
    })
    .addPublicMethod("removePipeline", (privateState, name) => {
        privateState.pipelines.delete(name);
    })
    .addPublicMethod("removeAllPipelines", (privateState) => {
        privateState.pipelines.clear();
    })
    .build()

const SOULDEW_STATE = Object.seal({
    pipelines: PipelinesObject
});

const SoulDew = Object.freeze({
    createPipeline: SOULDEW_STATE.pipelines.createPipeline,
    getPipeline: SOULDEW_STATE.pipelines.getPipeline,
    removePipeline: SOULDEW_STATE.pipelines.removePipeline,
    removeAllPipelines: SOULDEW_STATE.pipelines.removeAllPipelines,

    emit(pipelineName, eventName, data) {
        checkParams(arguments, [PRIMITIVE_TYPE_CONSTANTS.STRING, PRIMITIVE_TYPE_CONSTANTS.STRING, PRIMITIVE_TYPE_CONSTANTS.ANY]);

        const pipeline = this.getPipeline(pipelineName);
        if (!pipeline.validEvents.has(eventName)) throw new Error(`Event ${eventName} is not registered for pipeline ${pipeline.name}`);

        const handlers = pipeline.handlers.get(eventName);
        if (handlers) {
            for (const handler of handlers) {
                if (pipeline.sleeping.has(handler)) continue;
                handler(data);
            }
        }
    },
    request(pipelineName, eventName, data) {
        checkParams(arguments, [PRIMITIVE_TYPE_CONSTANTS.STRING, PRIMITIVE_TYPE_CONSTANTS.ANY]);

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
    on(pipelineName, eventName, handler) {
        checkParams(arguments, [PRIMITIVE_TYPE_CONSTANTS.STRING, PRIMITIVE_TYPE_CONSTANTS.STRING, PRIMITIVE_TYPE_CONSTANTS.FUNCTION]);

        const pipeline = this.getPipeline(pipelineName);
        if (!pipeline.validEvents.has(eventName)) throw new Error(`Event ${eventName} is not registered for pipeline ${pipeline.name}`);

        if (!pipeline.handlers.has(eventName)) {
            pipeline.handlers.set(eventName, new Set());
        }

        const handlers = pipeline.handlers.get(eventName);
        handlers?.add(handler);
    },
    onRequest(pipelineName, eventName, handler) {
        checkParams(arguments, [PRIMITIVE_TYPE_CONSTANTS.STRING, PRIMITIVE_TYPE_CONSTANTS.STRING, PRIMITIVE_TYPE_CONSTANTS.FUNCTION]);

        const pipeline = this.getPipeline(pipelineName);
        if (!pipeline.validEvents.has(eventName)) throw new Error(`Event ${eventName} is not registered for pipeline ${pipeline.name}`);

        if (!pipeline.responseHandlers.has(eventName)) {
            pipeline.responseHandlers.set(eventName, new Set());
        }

        const handlers = pipeline.responseHandlers.get(eventName);
        handlers?.add(handler);
    },
    off(pipelineName, eventName, handler) {
        checkParams(arguments, [PRIMITIVE_TYPE_CONSTANTS.STRING, PRIMITIVE_TYPE_CONSTANTS.STRING, PRIMITIVE_TYPE_CONSTANTS.FUNCTION]);

        const pipeline = this.getPipeline(pipelineName);

        const handlers = pipeline.handlers.get(eventName);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                pipeline.handlers.delete(eventName);
            }
        }
    },
    offRequest(pipelineName, eventName, handler) {
        checkParams(arguments, [PRIMITIVE_TYPE_CONSTANTS.STRING, PRIMITIVE_TYPE_CONSTANTS.STRING, PRIMITIVE_TYPE_CONSTANTS.FUNCTION]);

        const pipeline = this.getPipeline(pipelineName);

        const handlers = pipeline.responseHandlers.get(eventName);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                pipeline.responseHandlers.delete(eventName);
            }
        }
    },
    sleep(pipelineName, listen) {
        checkParams(arguments, [PRIMITIVE_TYPE_CONSTANTS.FUNCTION]);
        const pipeline = this.getPipeline(pipelineName);
        pipeline.sleeping.add(listen);
        return () => this.wake(pipelineName, listen);
    },
    wake(pipelineName, listen) {
        checkParams(arguments, [PRIMITIVE_TYPE_CONSTANTS.FUNCTION]);
        const pipeline = this.getPipeline(pipelineName);
        pipeline.sleeping.delete(listen);
    },
    once(pipelineName, eventName, handler) {
        checkParams(arguments, [PRIMITIVE_TYPE_CONSTANTS.STRING, PRIMITIVE_TYPE_CONSTANTS.STRING, PRIMITIVE_TYPE_CONSTANTS.FUNCTION]);

        const listen = (data) => {
            handler(data);
            this.off(pipelineName, eventName, listen);
        };

        this.on(pipelineName, eventName, listen);
    }
})

export default SoulDew;