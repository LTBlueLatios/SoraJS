/**
 * AltoMare - General purpose schema manager
 * Currently a Proof of Concept
 * @class
 */
class AltoMare {
    #schemas = new Map()
    #schemaInterpreters = new Map()

    constructor(schemas = [], interpreters = []) {
        this.registerSchema(schemas)
        this.registerInterpreter(interpreters)
    }

    #validateSchemaProperty(property, path) {
        // TODO: Change this into a handler map
        if (!property.type || typeof property.type !== "string") {
            throw new Error(`Property at ${path} must have a string type`)
        }

        const validTypes = ["string", "number", "object", "array", "boolean"]
        if (!validTypes.includes(property.type)) {
            throw new Error(`Property at ${path} has invalid type: ${property.type}`)
        }

        if (property.type === "string") {
            if (property.minLength !== undefined && typeof property.minLength !== "number") {
                throw new Error(`Property at ${path} has invalid minLength`)
            }
            if (property.maxLength !== undefined && typeof property.maxLength !== "number") {
                throw new Error(`Property at ${path} has invalid maxLength`)
            }
            if (property.pattern !== undefined && typeof property.pattern !== "string") {
                throw new Error(`Property at ${path} has invalid pattern`)
            }
        }

        if (property.type === "number") {
            if (property.range !== undefined) {
                if (!Array.isArray(property.range) || property.range.length !== 2) {
                    throw new Error(`Property at ${path} has invalid range`)
                }
                if (typeof property.range[0] !== "number" || typeof property.range[1] !== "number") {
                    throw new Error(`Property at ${path} range must contain numbers`)
                }
            }
        }

        if (property.enum !== undefined && !Array.isArray(property.enum)) {
            throw new Error(`Property at ${path} has invalid enum`)
        }
    }

    #validateRequiredFields(schema) {
        if (schema.required === undefined) return;

        if (!Array.isArray(schema.required)) {
            throw new Error("Required must be an array")
        }
        schema.required.forEach(field => {
            if (!schema.properties[field]) {
                throw new Error(`Required field ${field} not found in properties`)
            }
        })
    }

    #validateSchema(schema) {
        // TODO: Change this into a handler map
        if (!schema.name || typeof schema.name !== "string") {
            throw new Error("Schema must have a string name")
        }

        if (!schema.type || typeof schema.type !== "string") {
            throw new Error("Schema must have a string type")
        }

        if (!schema.interpreter || typeof schema.interpreter !== "string") {
            throw new Error("Schema must have a string interpreter")
        }

        if (!schema.properties || typeof schema.properties !== "object") {
            throw new Error("Schema must have an object properties")
        }

        if (!this.#schemaInterpreters.has(schema.interpreter)) {
            throw new Error(`Interpreter ${schema.interpreter} not found`)
        }

        Object.entries(schema.properties).forEach(([key, property]) => {
            this.#validateSchemaProperty(property, key)
        })

        this.#validateRequiredFields(schema);
    }

    registerInterpreter(plugins) {
        if (!Array.isArray(plugins)) plugins = [plugins]

        plugins.forEach(plugin => {
            if (this.#schemaInterpreters.has(plugin.type)) {
                throw new Error(`Interpreter ${plugin.type} already exists`)
            }

            this.#schemaInterpreters.set(plugin.type, plugin)
        })
    }

    registerSchema(schemas) {
        if (!Array.isArray(schemas)) schemas = [schemas]

        schemas.forEach(schema => {
            this.#validateSchema(schema)

            if (this.#schemas.has(schema.name)) {
                throw new Error(`Schema ${schema.name} already exists`)
            }

            this.#schemas.set(schema.name, schema)
        })
    }

    interpret(schemaName, data, options = {}) {
        const schema = this.#schemas.get(schemaName)
        if (!schema) {
            throw new Error(`Schema ${schemaName} not found`)
        }

        const interpreter = this.#schemaInterpreters.get(schema.interpreter)
        return interpreter.interpret(schema, data, options)
    }
}

export default AltoMare;