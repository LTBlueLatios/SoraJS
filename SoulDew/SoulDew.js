import Pipeline from "./Pipeline.js";

/**
 * @class
 */
class SoulDew {
    #pipelines = new Map();

    /**
     * Creates a new pipeline with strictly defined valid events.
     * Pipelines represent isolated communication channels between system components.
     * Each pipeline maintains its own set of valid events and handlers.
     *
     * @param {string} name - Unique identifier for the pipeline
     * @param {string[]} validEvents - Array of valid event names for this pipeline
     * @throws {Error} If pipeline with given name already exists
     * @returns {Pipeline} The created pipeline instance
     */
    createPipeline(name, validEvents) {
        if (this.#pipelines.has(name)) {
            throw new Error(`Pipeline ${name} already exists`);
        }
        const pipeline = new Pipeline(name, validEvents);
        this.#pipelines.set(name, pipeline);
        return pipeline;
    }

    /**
     * Retrieves an existing pipeline by name.
     *
     * @param {string} name - Name of the pipeline to retrieve
     * @throws {Error} If pipeline does not exist
     * @returns {Pipeline} The requested pipeline instance
     */
    getPipeline(name) {
        const pipeline = this.#pipelines.get(name);
        if (!pipeline) {
            throw new Error(`Pipeline ${name} does not exist`);
        }
        return pipeline;
    }

    /**
     * Removes a pipeline and all its handlers.
     *
     * @param {string} name - Name of the pipeline to remove
     */
    removePipeline(name) {
        this.#pipelines.delete(name);
    }

    /**
     * Removes all pipelines and all of their handlers.
     */
    removeAllPipelines() {
        this.#pipelines.clear();
    }
}

export default SoulDew;