import AltoMareRegistry from "./Registry.js";

const DEFAULT_BLOCK = {
    name: "properties",
    validate(properties, object) {
        const errors = [];

        if (properties.required) {
            for (const requiredProp of properties.required) {
                if (object[requiredProp] === undefined || object[requiredProp] === null) {
                    errors.push(`Property '${requiredProp}' is required but missing`);
                }
            }
        }

        for (const [propName, schemaDefinition] of Object.entries(properties)) {
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

        return errors;
    }
}

export default DEFAULT_BLOCK;