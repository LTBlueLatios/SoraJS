class ValidatorRegistry {
    #validators = new Map();
    #typeValidators = new Map();

    constructor() {
        this.initializeDefaultValidators();
        this.initializeTypeValidators();
    }

    initializeDefaultValidators() {
        this.register("enum", (value, enumValues) => enumValues.includes(value));
        this.register("min", (value, minValue) => value >= minValue);
        this.register("max", (value, maxValue) => value <= maxValue);
        this.register("minLength", (value, minLength) => value.length >= minLength);
        this.register("maxLength", (value, maxLength) => value.length <= maxLength);
        this.register("pattern", (value, pattern) => new RegExp(pattern).test(value));
    }

    initializeTypeValidators() {
        this.registerType("string", v => typeof v === "string");
        this.registerType("number", v => typeof v === "number");
        this.registerType("boolean", v => typeof v === "boolean");
        this.registerType("object", v => v && typeof v === "object" && !Array.isArray(v));
        this.registerType("array", Array.isArray);
        this.registerType("null", v => v === null);
        this.registerType("function", v => typeof v === "function");
        this.registerType("any", () => true);
    }

    register(name, validator) {
        if (typeof validator !== "function") {
            throw new Error("Validator must be a function");
        }
        this.#validators.set(name, validator);
    }

    registerType(name, validator) {
        if (typeof validator !== "function") {
            throw new Error("Type validator must be a function");
        }
        this.#typeValidators.set(name, validator);
    }

    getValidator(name) {
        return this.#validators.get(name);
    }

    getTypeValidator(name) {
        return this.#typeValidators.get(name);
    }

    hasValidator(name) {
        return this.#validators.has(name);
    }

    hasTypeValidator(name) {
        return this.#typeValidators.has(name);
    }
}

export default ValidatorRegistry;