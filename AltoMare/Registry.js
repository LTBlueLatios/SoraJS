/**
 * Internal registry for AltoMare's extensible components.
 * Manages the registration and retrieval of schemas, validation rules, and blocks.
 *
 * The registry serves as the central storage for all extensible components in AltoMare:
 * - Schemas: Define the structure and validation rules for objects
 * - Rules: Individual validation functions that can be reused across schemas
 * - Blocks: Custom schema interpreters that can implement complex validation logic
 *
 * @namespace
 */
const AltoMareRegistry = {
    /** @type {Map<string, AltoMareSchema>} */
    schemas: new Map(),

    /** @type {Map<string, function>} */
    rules: new Map(),

    /**
     * Blocks are a custom type in AltoMare schema validations,
     * where each block can create its own specific set of properties
     * and execute custom logic during schema interpretation.
     *
     * It took an incredibly large amount of iterations and rewrites
     * for me to arrive at a position for custom schema building whilst
     * retaining AltoMare's properties and preventing from things being
     * too complex.
     *
     * 5...to be exact.
     *
     * @type {Map<string, AltoMareBlock>}
     */
    blocks: new Map(),

    /**
     * Registers an array of schemas with the registry.
     * Each schema must have a unique ID.
     *
     * @param {AltoMareSchema[]} schemas - Array of schemas to register
     * @throws {Error} If a schema is invalid or duplicates an existing ID
     */
    registerSchemas(schemas) {
        schemas.forEach((schema) => {
            this.schemas.set(schema.name, schema);
        });
    },

    /**
     * Registers an array of validation rules with the registry.
     * Each rule must have a unique name and a validation callback.
     *
     * @param {AltoMareRule[]} rules - Array of rules to register
     * @throws {Error} If a rule is invalid or duplicates an existing name
     */
    registerRules(rules) {
        rules.forEach((rule) => {
            this.rules.set(rule.name, rule.callback);
        });
    },

    /**
     * Registers an array of blocks with the registry.
     * Each block must have a unique name and implement the required interface.
     *
     * @param {AltoMareBlock[]} blocks - Array of blocks to register
     * @throws {Error} If a block is invalid or duplicates an existing name
     */
    registerBlocks(blocks) {
        blocks.forEach((block) => {
            this.blocks.set(block.name, block);
        });
    },

    /**
     * Retrieves a schema by its ID.
     *
     * @param {string} schemaName - The ID of the schema to retrieve
     * @returns {AltoMareSchema | undefined} The requested schema
     * @throws {Error} If the schema is not found
     */
    getSchema(schemaName) {
        if (!this.schemas.has(schemaName)) {
            throw new Error(`Schema '${schemaName}' not found`);
        }
        return this.schemas.get(schemaName);
    },

    /**
     * Retrieves a validation rule by its name.
     *
     * @param {string} ruleName - The name of the rule to retrieve
     * @returns {function | undefined} The validation rule callback
     * @throws {Error} If the rule is not found
     */
    getRule(ruleName) {
        if (!this.rules.has(ruleName)) {
            throw new Error(`Rule '${ruleName}' not found`);
        }
        return this.rules.get(ruleName);
    },

    /**
     * Retrieves a block by its name.
     *
     * @param {string} blockName - The name of the block to retrieve
     * @returns {AltoMareBlock | undefined} The requested block
     * @throws {Error} If the block is not found
     */
    getBlock(blockName) {
        if (!this.blocks.has(blockName)) {
            throw new Error(`Block '${blockName}' not found`);
        }
        return this.blocks.get(blockName);
    },
};

export default AltoMareRegistry;