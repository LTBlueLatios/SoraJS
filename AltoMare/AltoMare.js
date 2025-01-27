import AltoMareRegistry from "./Registry.js";
import DEFAULT_BLOCK from "./DefaultBlock.js";
import DEFAULT_RULES from "./DefaultRules.js";

import { checkParams } from "../Utilities/CheckType.js";

/**
 * @version 0.0.1
 * @class
 *
 * @abstract
 * AltoMare is a general schematic system made to be simple and powerful.
 * Its strength lies in not what it already has, but what it can be built to do.
 * Each schema is interpreted in a block-like fashion, and such blocks are
 * designed in a way that is highly extensible.
 *
 * The system comes with a default block and set of rules for basic object
 * property validation, but is designed to be extended through its plugin
 * registration system.
 *
 * @todo Add support for schema inheritance
 * @todo Make rules only apply to specific blocks
 */
class AltoMare {
    /**
     * Creates a new instance of AltoMare and registers default rules and blocks.
     */
    constructor() {
        this.register("rule", [...DEFAULT_RULES]);
        this.register("block", [DEFAULT_BLOCK]);
    }

    /**
     * Registers a set of items to the AltoMare registry.
     * Supports registration of schemas, rules, and blocks.
     *
     * @param {('schema'|'rule'|'block')} type - The type of items to register
     * @param {Array<AltoMareSchema|AltoMareRule|AltoMareBlock>} items - The items to register
     * @throws {Error} If items are invalid or registration type is unknown
     */
    register(type, items) {
        checkParams(arguments, ["string", "array"]);

        if (!items || !Array.isArray(items)) throw new Error("Invalid items provided for registration");
        const handlers = {
            schema: AltoMareRegistry.registerSchemas,
            rule: AltoMareRegistry.registerRules,
            block: AltoMareRegistry.registerBlocks
        };

        const handler = handlers[type];
        if (!handler) throw new Error(`Unknown registration type: ${type}`);
        handler.call(AltoMareRegistry, items);
    }

    /**
     * Validates an object against a registered schema.
     * The validation process:
     * 1. Retrieves the schema from the registry
     * 2. For each registered block that has a corresponding section in the schema:
     *    - Calls the block's validate method
     *    - Collects any validation errors
     * 3. If any errors occurred, throws them as a single error message
     *
     * @param {string} schemaName - The ID of the schema to validate against
     * @param {Object} object - The object to validate
     * @returns {boolean} True if validation succeeds
     * @throws {Error} If schema is not found, object is invalid, or validation fails
     */
    validate(schemaName, object) {
        checkParams(arguments, ["string", "object"]);

        const schema = AltoMareRegistry.getSchema(schemaName);

        if (!schema) throw new Error(`Schema '${schemaName}' not found`);
        if (!object || typeof object !== "object") throw new Error("Invalid object provided for validation");

        const errors = [];
        for (const [blockId, block] of AltoMareRegistry.blocks) {
            if (schema[blockId]) {
                const blockErrors = block.validate(schema[blockId], object);
                errors.push(...blockErrors);
            }
        }

        if (errors.length > 0)
            throw new Error(errors.join("\n"));

        return true;
    }
}

export default AltoMare;