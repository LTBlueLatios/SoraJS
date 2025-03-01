import AltoMareRegistry from "./Registry.js";

const DEFAULT_BLOCK = {
    name: "properties",
    process(schema, object) {
        const errors = [];

        if (schema.required) {
            for (const requiredProp of schema.required) {
                if (object[requiredProp] === undefined || object[requiredProp] === null) {
                    errors.push(`Property '${requiredProp}' is required but missing`);
                }
            }
        }

        for (const [propName, schemaDefinition] of Object.entries(schema)) {
            const value = object[propName];

            if (schemaDefinition.required && (value === undefined || value === null)) {
                errors.push(`Property '${propName}' is required but missing`);
                continue;
            }

            if (value === undefined || value === null) continue;

            for (const [ruleName, ruleValue] of Object.entries(schemaDefinition)) {
                const ruleFunction = AltoMareRegistry.getRule(ruleName);
                if (ruleFunction) {
                    try {
                        ruleFunction(value, ruleValue);
                    } catch (error) {
                        errors.push(`Property '${propName}' failed ${ruleName} validation: ${error.message}`);
                    }
                }
            }
        }

        if (!errors.length < 0) return errors;
        return true;
    }
}

export default DEFAULT_BLOCK;