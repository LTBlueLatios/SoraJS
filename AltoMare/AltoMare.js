import ValidatorRegistry from "./ValidatorRegistry";
import SchemaValidator from "./SchemaValidator";

class AltoMare {
    #schemas = new Map();
    #templates = new Map();
    #validator;
    #registry;

    constructor(mode = "silent") {
        this.#registry = new ValidatorRegistry();
        this.checkParams(arguments, ["string"]);
        this.#validator = new SchemaValidator(this.#registry, mode);
    }

    registerValidators(validators) {
        this.checkParams(arguments, ["object"]);

        if (Array.isArray(validators)) {
            validators.forEach(validator => this.registerValidators(validator));
            return;
        }

        Object.entries(validators).forEach(([name, validator]) => {
            this.#registry.register(name, validator);
        });
    }

    register(name, schema) {
        this.checkParams(arguments, ["string", "object"]);
        this.#schemas.set(name, schema);
    }

    registerFromTemplate(name, templateName, overrides = {}) {
        this.checkParams(arguments, ["string", "string", "object"]);
        const template = this.#templates.get(templateName);
        if (!template) {
            throw new Error(`Template '${templateName}' not found`);
        }
        this.register(name, { ...template, ...overrides });
    }

    validate(schemaName, data) {
        this.checkParams(arguments, ["string", "object"]);
        const schema = this.get(schemaName);
        return this.#validator.validateSchema(schema, data, schemaName);
    }

    checkParams(args, types) {
        if (!Array.isArray(types)) {
            throw new Error("Second argument 'types' must be an array");
        }

        if (args.length !== types.length) {
            throw new Error(`Expected ${types.length} parameters but got ${args.length}`);
        }

        for (let i = 0; i < args.length; i++) {
            const typeValidator = this.#registry.getTypeValidator(types[i]);
            if (!typeValidator) {
                throw new Error(`Unknown type '${types[i]}'`);
            }

            if (!typeValidator(args[i])) {
                throw new Error(`Parameter at index ${i} failed type validation. Expected ${types[i]}, got ${typeof args[i]}`);
            }
        }

        return true;
    }

    get(name) {
        this.checkParams(arguments, ["string"]);
        const schema = this.#schemas.get(name);
        if (!schema) {
            throw new Error(`Schema '${name}' not found`);
        }
        return schema;
    }

    unregister(name) {
        this.checkParams(arguments, ["string"]);
        this.#schemas.delete(name);
    }

    loadTemplates(templateJson) {
        this.checkParams(arguments, ["string"]);
        try {
            const templates = JSON.parse(templateJson);
            this.#templates = new Map(Object.entries(templates));
        } catch (error) {
            throw new Error(`Failed to parse templates JSON: ${error.message}`);
        }
    }
}

export default AltoMare;