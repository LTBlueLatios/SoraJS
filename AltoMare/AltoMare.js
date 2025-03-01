import AltoMareRegistry from "./Registry.js";
import DEFAULT_BLOCK from "./DefaultBlock.js";
import DEFAULT_RULES from "./DefaultRules.js";

import { checkParams } from "../Utilities/CheckType.js";
import { PRIMITIVE_TYPE_CONSTANTS } from "../Utilities/TypeConstants.js";

const REGISTRY_CONSTANTS = {
    SCHEMA: "schema",
    RULE: "rule",
    BLOCK: "block"
};

// New definition: An extensible data parser that utilises a schema block format with rule functions.
class AltoMare {
    constructor() {
        this.register("rule", DEFAULT_RULES);
        this.register("block", [DEFAULT_BLOCK]);
    }

    register(type, items) {
        checkParams(arguments, [PRIMITIVE_TYPE_CONSTANTS.STRING, PRIMITIVE_TYPE_CONSTANTS.OBJECT]);

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

    process(schemaName, object, options = {
        thymeMode: "write"
    }) {
        checkParams(arguments, [
            PRIMITIVE_TYPE_CONSTANTS.STRING,
            PRIMITIVE_TYPE_CONSTANTS.OBJECT,
            PRIMITIVE_TYPE_CONSTANTS.OBJECT
        ]);

        const schema = AltoMareRegistry.getSchema(schemaName);
        if (!schema) throw new Error(`Schema '${schemaName}' not found`);
        if (!object || typeof object !== "object") throw new Error("Invalid object provided for processing");

        const results = new Map();

        for (const [blockName, block] of AltoMareRegistry.blocks) {
            if (schema[blockName]) {
                const blockResult = block.process(schema[blockName], object, options);
                if (blockResult !== undefined) {
                    results.set(blockName, blockResult);
                }
            }
        }

        return results;
    }
}

export { AltoMare, AltoMareRegistry as Registry, REGISTRY_CONSTANTS };