/**
 * A schema validation system that allows defining, validating, and managing data schemas.
 *
 * Made for the Sora.js library
 */
class AltoMare {
    #schemas = {};
    #templates = {};
    #validators = {
        enum: (value, enumValues) => enumValues.includes(value),
        min: (value, minValue) => value >= minValue,
        max: (value, maxValue) => value <= maxValue,
        minLength: (value, minLength) => value.length >= minLength,
        maxLength: (value, maxLength) => value.length <= maxLength,
        pattern: (value, pattern) => new RegExp(pattern).test(value)
    };
    #typeValidators = {
        string: v => typeof v === "string",
        number: v => typeof v === "number",
        boolean: v => typeof v === "boolean",
        object: v => v && typeof v === "object" && !Array.isArray(v),
        array: Array.isArray,
        null: v => v === null,
        any: () => true
    };

    /**
     * Registers a custom validator or a set of validators.
     *
     * @param {Object<string, Function>|Function|Array<Object<string, Function>>} validators
     *  - An object with validator names as keys and validator functions as values,
     *    or an array of such objects, or a single validator function (must throw an error).
     * @throws {Error} If a function is provided instead of an object with a name.
     */
    registerValidator(validators) {
        if (typeof validators === "function") {
            throw new Error("Validator must have a name. Use an object with name as key.");
        }

        if (Array.isArray(validators)) {
            validators.forEach(validator => this.registerValidator(validator));
            return;
        }

        Object.entries(validators).forEach(([name, validator]) => {
            this.#validators[name] = validator;
        });
    }

    /**
     * Registers a schema with a specific name.
     *
     * @param {string} name - The unique name of the schema.
     * @param {Object} schema - The schema definition.
     */
    register(name, schema) {
        this.#schemas[name] = schema;
    }

    /**
     * Registers a schema by extending an existing template with optional overrides.
     *
     * @param {string} name - The unique name of the new schema.
     * @param {string} templateName - The name of the template to extend.
     * @param {Object} [overrides={}] - Properties to override in the template.
     * @throws {Error} If the template does not exist.
     */
    registerFromTemplate(name, templateName, overrides = {}) {
        const template = this.#templates[templateName];
        if (!template) throw new Error(`Template '${templateName}' not found`);
        this.register(name, { ...template, ...overrides });
    }

    /**
     * Validates data against a registered schema.
     *
     * @param {string} schemaName - The name of the schema to validate against.
     * @param {Object} data - The data to validate.
     * @returns {boolean} True if validation passes.
     * @throws {Error} If validation fails or the schema is not found.
     */
    validate(schemaName, data) {
        const schema = this.get(schemaName);
        return this.#validateSchema(schemaName, schema, data);
    }

    /**
     * Retrieves a schema by name.
     *
     * @param {string} name - The name of the schema.
     * @returns {Object} The schema definition.
     * @throws {Error} If the schema is not found.
     */
    get(name) {
        const schema = this.#schemas[name];
        if (!schema) throw new Error(`Schema '${name}' not found`);
        return schema;
    }

    /**
     * Unregisters a schema by name.
     *
     * @param {string} name - The name of the schema to remove.
     */
    unregister(name) {
        delete this.#schemas[name];
    }

    /**
     * Loads templates from a JSON string.
     *
     * @param {string} templateJson - A JSON string containing templates.
     */
    loadTemplates(templateJson) {
        try {
            this.#templates = JSON.parse(templateJson);
        } catch (error) {
            throw new Error(`Failed to parse templates JSON: ${error.message}`);
        }
    }

    /**
     * Validates that all required properties are present in the data.
     *
     * @private
     * @param {Object} data - The data to validate.
     * @param {Object} schema - The schema definition.
     * @param {string} schemaName - The name of the schema for error reporting.
     * @throws {Error} If a required property is missing.
     */
    #validateRequired(data, schema, schemaName) {
        const required = schema.requiredProperties || [];
        const missing = required.filter(key => !(key in data));
        if (missing) {
            throw new Error(`Schema ${schemaName}: required property '${missing.join(", ")}' missing`);
        }
    }

    /**
     * Validates properties of the data against schema rules.
     *
     * @private
     * @param {Object} data - The data to validate.
     * @param {Object} schema - The schema definition.
     * @param {string} schemaName - The name of the schema for error reporting.
     * @returns {boolean} True if validation passes.
     * @throws {Error} If any property validation fails.
     */
    #validateProperties(data, schema, schemaName) {
        const allowedKeys = Object.keys(schema).filter(key => key !== "requiredProperties");
        const dataKeys = Object.keys(data);
        const unknownKeys = dataKeys.filter(key => !allowedKeys.includes(key));
        if (unknownKeys.length > 0) {
            throw new Error(`Schema ${schemaName}: unknown properties '${unknownKeys.join(", ")}' are not allowed`);
        }

        for (const [key, rule] of Object.entries(schema)) {
            if (key === "requiredProperties" || !(key in data)) continue;

            const value = data[key];
            const currentSchemaName = `${schemaName}.${key}`;

            this.#validateType(value, rule, currentSchemaName);
            this.#validateRules(value, rule, currentSchemaName);
            this.#validateNested(value, rule, currentSchemaName);
        }

        return true;
    }

    /**
     * Validates the type of a value against the schema's type rule.
     *
     * @private
     * @param {*} value - The value to validate.
     * @param {Object} rule - The rule containing type information.
     * @param {string} schemaName - The name of the schema for error reporting.
     * @throws {Error} If the type validation fails.
     */
    #validateType(value, rule, schemaName) {
        if (!this.#typeValidators[rule.type]) {
            throw new Error(`Schema ${schemaName}: unknown type '${rule.type}'`);
        }
        if (rule.type && !this.#typeValidators[rule.type]?.(value)) {
            throw new Error(`Schema ${schemaName}: type validation failed. Expected ${rule.type}, got ${typeof value}`);
        }
    }

    /**
     * Validates a value against rule-specific validators (e.g., min, max, pattern).
     *
     * @private
     * @param {*} value - The value to validate.
     * @param {Object} rule - The rule containing validation constraints.
     * @param {string} schemaName - The name of the schema for error reporting.
     * @throws {Error} If any rule validation fails.
     */
    #validateRules(value, rule, schemaName) {
        for (const [validatorName, validator] of Object.entries(this.#validators)) {
            if (rule[validatorName] !== undefined) {
                if (!validator(value, rule[validatorName])) {
                    throw new Error(`Schema ${schemaName}: ${validatorName} validation failed`);
                }
            }
        }
    }

    #validateSchema(schemaName, schema, data) {
        this.#validateRequired(data, schema, schemaName);
        return this.#validateProperties(data, schema, schemaName);
    }

    /**
     * Validates nested properties or array items based on schema rules.
     *
     * @private
     * @param {*} value - The value to validate.
     * @param {Object} rule - The rule containing nested property or item schemas.
     * @param {string} schemaName - The name of the schema for error reporting.
     * @throws {Error} If nested validation fails.
     */
    #validateNested(value, rule, schemaName) {
        if (rule.properties && value) {
            this.#validateSchema(schemaName, rule.properties, value);
        }

        if (rule.items && Array.isArray(value)) {
            value.forEach((item, index) => {
                const arraySchemaName = `${schemaName}[${index}]`;
                this.#validateSchema(arraySchemaName, rule.items, item);
            });
        }
    }
}

export default AltoMare;