import ThymeReader from "./components/ThymeReader";
import ThymeWriter from "./components/ThymeWriter";

/**
 * Thyme - A lightweight, customizable data encoder/decoder for efficient data serialization.
 * Made for the Sora.js Library.
 */
class Thyme {
    // Standalone Custom Codec plugins for handling specialized data types
    // Each codec must implement encode() and decode() methods
    #codecs = new Map();

    // Objects with key -> types mapping for schema validation and type checking
    // Stores predefined data structures and their corresponding field types
    #schematics = new Map();

    // Extensible Functionality to original class (ex: including a custom encoding type)
    // Allows for runtime extension of Thyme's capabilities
    #plugins = new Map();

    static #writeHandlers = {
        "Int8": ThymeWriter.writeInt8,
        "Uint8": ThymeWriter.writeUint8,
        "Int16": ThymeWriter.writeInt16,
        "Uint16": ThymeWriter.writeUint16,
        "Int32": ThymeWriter.writeInt32,
        "Uint32": ThymeWriter.writeUint32,
        "Float32": ThymeWriter.writeFloat32,
        "Float64": ThymeWriter.writeFloat64,
        "Vector2": ThymeWriter.writeVector2,
        "Vector3": ThymeWriter.writeVector3,
        "Vector4": ThymeWriter.writeVector4,
        "Matrix3x3": ThymeWriter.writeMatrix3x3,
        "Matrix4x4": ThymeWriter.writeMatrix4x4,
        "String": ThymeWriter.writeString
    };

    static #readHandlers = {
        "Int8": ThymeReader.readInt8,
        "Uint8": ThymeReader.readUint8,
        "Int16": ThymeReader.readInt16,
        "Uint16": ThymeReader.readUint16,
        "Int32": ThymeReader.readInt32,
        "Uint32": ThymeReader.readUint32,
        "Float32": ThymeReader.readFloat32,
        "Float64": ThymeReader.readFloat64,
        "Vector2": ThymeReader.readVector2,
        "Vector3": ThymeReader.readVector3,
        "Vector4": ThymeReader.readVector4,
        "Matrix3x3": ThymeReader.readMatrix3x3,
        "Matrix4x4": ThymeReader.readMatrix4x4,
        "String": ThymeReader.readString
    };

    static TYPE_MAPPINGS = {
        INT8: "Int8",
        UINT8: "Uint8",
        INT16: "Int16",
        UINT16: "Uint16",
        INT32: "Int32",
        UINT32: "Uint32",
        FLOAT32: "Float32",
        FLOAT64: "Float64",
        VECTOR2: "Vector2",
        VECTOR3: "Vector3",
        VECTOR4: "Vector4",
        MATRIX3X3: "Matrix3x3",
        MATRIX4X4: "Matrix4x4",
        STRING: "String"
    };

    /**
     * Registers a custom codec for a specific data type
     * @param {string} type - The name of the data type
     * @param {Object} codec - The codec implementation
     */
    register(type, codec) {
        if (this.#codecs.has(type)) {
            throw new Error(`Type ${type} is already registered`);
        }

        const { shape, encode, decode } = codec;

        if (!shape || typeof encode !== "function" || typeof decode !== "function") {
            throw new Error("Codec object must contain a shape, encoder, and decoder");
        }

        this.#codecs.set(type, codec);
    }

    /**
     * Registers a schema for type validation
     * @param {string} name - Name of the schema
     * @param {Object} schema - Schema definition with field types
     */
    registerSchema(name, schema) {
        if (this.#schematics.has(name)) {
            throw new Error(`Schema ${name} is already registered`);
        }

        // Validate schema structure
        if (typeof schema !== "object" || !schema) {
            throw new Error("Schema must be a valid object");
        }

        // Validate that all type references are valid
        for (const [field, type] of Object.entries(schema)) {
            if (!Thyme.#writeHandlers[type] && !this.#codecs.has(type)) {
                throw new Error(`Invalid type "${type}" for field "${field}"`);
            }
        }

        this.#schematics.set(name, schema);
    }

    /**
     * Validates data against a registered schema
     * @param {string} schemaName - Name of the schema to validate against
     * @param {Object} data - Data to validate
     * @returns {boolean} - True if valid, throws error if invalid
     */
    validateSchema(schemaName, data) {
        const schema = this.#schematics.get(schemaName);
        if (!schema) {
            throw new Error(`Schema ${schemaName} not found`);
        }

        for (const [field, type] of Object.entries(schema)) {
            if (!(field in data)) {
                throw new Error(`Missing required field "${field}"`);
            }

            const value = data[field];
            if (value === null || value === undefined) {
                throw new Error(`Field "${field}" cannot be null or undefined`);
            }

            // Type validation based on registered codecs or built-in types
            if (this.#codecs.has(type)) {
                const codec = this.#codecs.get(type);
                if (!codec.validate?.(value)) {
                    throw new Error(`Invalid value for field "${field}" of type "${type}"`);
                }
            }
        }

        return true;
    }

    /**
     * Registers a plugin to extend Thyme's functionality
     * @param {string} name - Name of the plugin
     * @param {Object} plugin - Plugin implementation
     */
    registerPlugin(name, plugin) {
        if (this.#plugins.has(name)) {
            throw new Error(`Plugin ${name} is already registered`);
        }

        // Validate plugin structure
        if (!plugin || typeof plugin.initialize !== "function") {
            throw new Error("Plugin must have an initialize method");
        }

        // Initialize plugin with current instance
        plugin.initialize(this);
        this.#plugins.set(name, plugin);
    }

    /**
     * Executes a plugin's method
     * @param {string} pluginName - Name of the plugin
     * @param {string} methodName - Name of the method to execute
     * @param {...any} args - Arguments to pass to the method
     * @returns {any} - Result of the plugin method
     */
    executePlugin(pluginName, methodName, ...args) {
        const plugin = this.#plugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Plugin ${pluginName} not found`);
        }

        if (typeof plugin[methodName] !== "function") {
            throw new Error(`Method ${methodName} not found in plugin ${pluginName}`);
        }

        return plugin[methodName](...args);
    }

    encode(type, data) {
        if (data === undefined || data === null) {
            throw new Error("Data cannot be null or undefined");
        }

        // If a schema is registered for this type, validate the data
        if (this.#schematics.has(type)) {
            this.validateSchema(type, data);
        }

        // todo: recode this
        if (Array.isArray(data)) {
            const bytes = [Thyme.MARKERS.ARRAY];
            bytes.push(...Thyme.encodeNumber(data.length));

            for (const item of data) {
                const encoded = this.#getCodec(type).encode(item);
                bytes.push(...Thyme.encodeNumber(encoded.length));
                bytes.push(...encoded);
            }
            return bytes;
        }

        const codec = this.#getCodec(type);
        return codec.encode(data);
    }

    decode(type, encoded) {
        if (!Array.isArray(encoded)) {
            throw new Error("Encoded data must be an array");
        }

        // todo: recode this
        if (encoded[0] === Thyme.MARKERS.ARRAY) {
            const pos = { pos: 1 };
            const length = Thyme.readNumber(encoded, pos);
            const results = [];

            for (let i = 0; i < length; i++) {
                const itemLength = Thyme.readNumber(encoded, pos);
                const itemBytes = encoded.slice(pos.pos, pos.pos + itemLength);
                results.push(this.#getCodec(type).decode(itemBytes));
                pos.pos += itemLength;
            }

            return results;
        }

        const codec = this.#getCodec(type);
        return codec.decode(encoded);
    }

    #getCodec(type) {
        // Check for built-in types first
        if (Thyme.#writeHandlers[type] && Thyme.#readHandlers[type]) {
            return {
                encode: (data) => {
                    // ! dangerous, implement dynamic sizes
                    const buffer = new ArrayBuffer(1024);
                    const posRef = { offset: 0 };
                    Thyme.write(type, buffer, posRef, data);
                    return new Uint8Array(buffer, 0, posRef.offset);
                },
                decode: (encoded) => {
                    const buffer = new ArrayBuffer(encoded.length);
                    new Uint8Array(buffer).set(encoded);
                    const posRef = { offset: 0 };
                    return Thyme.read(type, buffer, posRef);
                }
            };
        }

        // Then check custom codecs
        const codec = this.#codecs.get(type);
        if (!codec) {
            throw new Error(`No codec registered for type ${type}`);
        }
        return codec;
    }

    static write(type, buffer, posRef, data) {
        if (buffer.every(Number.isInteger)) {
            buffer = new Uint8Array(buffer).buffer;
        }

        if (!(buffer instanceof ArrayBuffer)) {
            throw new Error("Invalid buffer: Expected an ArrayBuffer.");
        }

        if (!posRef || typeof posRef.offset !== "number") {
            throw new Error("Invalid posRef: Expected an object with an 'offset' property.");
        }

        const dataView = new DataView(buffer);
        const handler = Thyme.#writeHandlers[type];
        if (handler) {
            return handler(dataView, posRef, data);
        }
    }

    static read(type, buffer, posRef, rest) {
        if (Array.isArray(buffer) && buffer.every(Number.isInteger)) {
            buffer = new Uint8Array(buffer).buffer;
        }

        if (!(buffer instanceof ArrayBuffer)) {
            throw new Error("Invalid buffer: Expected an ArrayBuffer.");
        }

        if (!posRef || typeof posRef.offset !== "number") {
            throw new Error("Invalid posRef: Expected an object with an 'offset' property.");
        }

        const dataView = new DataView(buffer);
        const handler = Thyme.#readHandlers[type];
        if (handler) {
            return handler(dataView, posRef, rest);
        }
    }
}

export default Thyme;