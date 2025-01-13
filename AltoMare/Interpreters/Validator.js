const Validator = {
    type: "validator",

    interpret(schema, data, options = {}) {
        const errors = []
        const result = {
            valid: true,
            errors: [],
            data: { ...data }
        }

        if (schema.required) {
            for (const field of schema.required) {
                if (data[field] === undefined) {
                    errors.push({
                        path: field,
                        message: `Missing required field: ${field}`
                    })
                }
            }
        }

        for (const [key, value] of Object.entries(data)) {
            const propertyErrors = this.validateProperty(schema, key, value, result)
            errors.push(...propertyErrors)
        }

        if (errors.length > 0) {
            result.valid = false
            result.errors = errors

            if (options.throwErrors) {
                throw new Error(JSON.stringify(result.errors, null, 2))
            }
        }

        return result
    },

    validateProperty(schema, key, value, result) {
        const errors = []
        const propertySchema = schema.properties[key]

        if (!propertySchema) {
            errors.push({
                path: key,
                message: `Unknown property: ${key}`
            })
            return errors
        }

        if (value === undefined && propertySchema.default !== undefined) {
            result.data[key] = propertySchema.default
            return errors
        }

        if (!this.validateType(value, propertySchema.type)) {
            errors.push({
                path: key,
                message: `Invalid type: expected ${propertySchema.type}`
            })
            return errors
        }

        if (propertySchema.type === "string") {
            const stringErrors = this.validateString(value, propertySchema, key)
            errors.push(...stringErrors)
        }

        if (propertySchema.type === "number") {
            const numberErrors = this.validateNumber(value, propertySchema, key)
            errors.push(...numberErrors)
        }

        if (propertySchema.enum && !propertySchema.enum.includes(value)) {
            errors.push({
                path: key,
                message: `Value must be one of: ${propertySchema.enum.join(", ")}`
            })
        }

        return errors
    },

    validateType(value, expectedType) {
        switch (expectedType) {
            case "string":
                return typeof value === "string"
            case "number":
                return typeof value === "number"
            case "boolean":
                return typeof value === "boolean"
            case "object":
                return typeof value === "object" && value !== null
            case "array":
                return Array.isArray(value)
            default:
                return false
        }
    },

    validateString(value, schema, path) {
        const errors = []

        if (schema.minLength !== undefined && value.length < schema.minLength) {
            errors.push({
                path,
                message: `String length must be at least ${schema.minLength}`
            })
        }

        if (schema.maxLength !== undefined && value.length > schema.maxLength) {
            errors.push({
                path,
                message: `String length must be at most ${schema.maxLength}`
            })
        }

        if (schema.pattern) {
            const regex = new RegExp(schema.pattern)
            if (!regex.test(value)) {
                errors.push({
                    path,
                    message: `String must match pattern: ${schema.pattern}`
                })
            }
        }

        return errors
    },

    validateNumber(value, schema, path) {
        const errors = []

        if (schema.range) {
            const [min, max] = schema.range
            if (value < min || value > max) {
                errors.push({
                    path,
                    message: `Number must be between ${min} and ${max}`
                })
            }
        }

        return errors
    }
}

export default Validator;