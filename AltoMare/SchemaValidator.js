class SchemaValidator {
    #registry;
    #mode;

    constructor(registry, mode) {
        this.#registry = registry;
        this.#mode = mode;
    }

    validateSchema(schema, data, schemaPath) {
        const errors = [];

        errors.push(...this.validateRequired(data, schema, schemaPath));
        errors.push(...this.validateProperties(data, schema, schemaPath));

        if (errors.length === 0) return true;

        if (this.#mode === "debug") {
            console.error("Validation errors:", errors);
        }
        return false;
    }

    validateValue(value, rule, schemaPath) {
        const errors = [];

        if (value !== undefined) {
            errors.push(...this.validateType(value, rule, schemaPath));
            errors.push(...this.validateRules(value, rule, schemaPath));
            if ((rule.items && Array.isArray(value)) || (rule.properties && typeof value === "object")) {
                errors.push(...this.validateNested(value, rule, schemaPath));
            }
        }

        return errors;
    }

    validateType(value, rule, schemaPath) {
        const errors = [];
        if (!rule.type) return errors;

        const typeValidator = this.#registry.getTypeValidator(rule.type);
        if (!typeValidator) {
            errors.push({
                path: schemaPath,
                message: `Unknown type '${rule.type}'`,
            });
        }

        if (!typeValidator(value)) {
            errors.push({
                path: schemaPath,
                message: `Type validation failed. Expected ${rule.type}, got ${typeof value}`,
                value,
            });
        }

        return errors;
    }

    validateRules(value, rule, schemaPath) {
        const errors = [];
        for (const [ruleName, ruleConfig] of Object.entries(rule)) {
            if (["type", "required"].includes(ruleName)) {
                continue;
            }

            const validator = this.#registry.getValidator(ruleName);
            if (!validator) continue;

            const ruleValue = ruleConfig?.value ?? ruleConfig;
            const message = ruleConfig?.message;

            if (!validator(value, ruleValue)) {
                errors.push({
                    path: schemaPath,
                    message: message || `${ruleName} validation failed`,
                    value,
                });
            }
        }
        return errors;
    }

    validateNested(value, rule, schemaPath) {
        const errors = [];
        if (rule.properties && value) {
            errors.push(...this.validateSchema(rule.properties, value, schemaPath));
        }

        if (rule.items && Array.isArray(value)) {
            value.forEach((item, index) => {
                const itemSchemaPath = `${schemaPath}[${index}]`;
                errors.push(...this.validateValue(item, rule.items, itemSchemaPath));
            });
        }

        return errors;
    }

    validateRequired(data, schema, schemaPath) {
        const errors = [];
        const required = schema.requiredProperties || [];
        const missingProperties = required.filter(key => !(key in data));
        if (missingProperties.length > 0) {
            missingProperties.forEach(key => {
                errors.push({
                    path: `${schemaPath}.${key}`,
                    message: `Required property '${key}' is missing`,
                    data,
                });
            });
        }
        return errors;
    }

    validateProperties(data, schema, schemaPath) {
        const errors = [];

        if (typeof data !== "object" || data === null || Array.isArray(data)) {
            errors.push({
                path: schemaPath,
                message: `Invalid data type: expected an object but got ${Array.isArray(data) ? 'array' : typeof data}`,
                data,
            });
            return errors;
        }

        const allowedKeys = Object.keys(schema).filter(key => key !== "requiredProperties");
        const dataKeys = Object.keys(data);
        const unknownKeys = dataKeys.filter(key => !allowedKeys.includes(key));

        if (unknownKeys.length > 0) {
            errors.push({
                path: schemaPath,
                message: `Unknown properties '${unknownKeys.join(", ")}' are not allowed`,
                data,
            });
        }

        for (const [key, rule] of Object.entries(schema)) {
            if (key === "requiredProperties" || !(key in data)) continue;

            const value = data[key];
            const propertyPath = `${schemaPath}.${key}`;
            errors.push(...this.validateValue(value, rule, propertyPath));
        }

        return errors;
    }
}

export default SchemaValidator;