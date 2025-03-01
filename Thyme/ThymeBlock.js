import { Thyme, ThymeRegistry } from "./Thyme.js";

const ThymeBlock = {
    name: "thyme",
    writeData(view, schema, data) {
        const posRef = { offset: 0 };

        for (const [key, typeInfo] of Object.entries(schema)) {
            if (typeInfo.builder) {
                Thyme.builderWrite(typeInfo.builder, view, data[key], posRef)
                continue;
            }
            Thyme.write(typeInfo, view, data[key], posRef);
        }
    },

    process(schema, data, options) {
        const errors = [];

        if (options.thymeMode === "write") {
            // Validation phase
            const validationErrors = this.validateData(schema, data);
            errors.push(...validationErrors);

            if (errors.length > 0) {
                return {
                    errors,
                    data: null,
                    transformed: false
                };
            }

            const transformedData = new Uint8Array(this.calculateSize(schema, data));
            const view = new DataView(transformedData.buffer);

            try {
                this.writeData(view, schema, data);
            } catch (error) {
                errors.push(`Binary transformation error: ${error.message}`);
                return {
                    errors,
                    data: null,
                    transformed: false
                };
            }

            return {
                errors,
                data: transformedData,
                transformed: true
            };
        } else if (options.thymeMode === "read") {
            const results = {};
            const view = new DataView(data);
            const posRef = { offset: 0 };

            try {
                for (const [key, typeInfo] of Object.entries(schema)) {
                    if (typeInfo.builder) {
                        results[key] = Thyme.builderRead(typeInfo.builder, view, posRef);
                        continue;
                    }
                    results[key] = Thyme.read(typeInfo, view, posRef);
                }
            } catch(error) {
                errors.push(`Binary transformation error: ${error.message}`);
                return {
                    errors,
                    data: null,
                    transformed: false
                };
            }

            return {
                errors,
                data: results,
                transformed: true
            };
        }
    },
    validateData(schema, data) {
        const errors = [];

        for (const [key, typeInfo] of Object.entries(schema)) {
            // todo: Add a required field check
            if (data[key] === undefined) {
                errors.push(`Missing required field: ${key}`);
                continue;
            }

            if (typeInfo.builder) {
                const builder = ThymeRegistry.builders.get(typeInfo.builder);
                if (builder) {
                    const builderErrors = builder.validate(data[key]);
                    errors.push(...builderErrors.map(err => `${key}: ${err}`));
                }
            } else {
                const typeErrors = this.validateType(typeInfo, data[key], key);
                errors.push(...typeErrors);
            }
        }

        return errors;
    },
    validateType(typeInfo, data, key) {
        const errors = [];
        // We'll use the rule functionality for this
        return errors;
    },
    calculateSize(schema, data) {
        let size = 0;

        for (const [key, typeInfo] of Object.entries(schema)) {
            if (typeInfo.builder) {
                const builder = ThymeRegistry.builders.get(typeInfo.builder);
                size += builder.calculateSize(data[key]);
                continue;
            }
            size += this.sizeOf(typeInfo);
        }

        return size;
    },
    sizeOf(typeInfo) {
        const sizeOf = {
            Int8: 1,
            Uint8: 1,
            Int16: 2,
            Uint16: 2,
            Int32: 4,
            Uint32: 4,
            Float32: 4,
            Float64: 8,
            Vector2: 8,
            Vector3: 12,
            Vector4: 16,
            Matrix3x3: 36,
            Matrix4x4: 64
        };

        return sizeOf[typeInfo] || 0;
    }
};

export default ThymeBlock;