import { AltoMare } from "../AltoMare/AltoMare.js";
import { checkParams } from "../Utilities/CheckType.js";
import ThymeRegistry from "./ThymeRegistry.js";
import ThymeBlock from "./ThymeBlock.js";

import * as ThymeWriter from "./components/Write.js";
import * as ThymeReader from "./components/Read.js";
import * as ThymeUtilities from "./components/Utilities.js"

const THYME_WRITE_CONSTANTS = {
    Int8: ThymeWriter.writeInt8,
    Int16: ThymeWriter. writeInt16,
    INt32: ThymeWriter.writeInt32,
    Uint8: ThymeWriter.writeUint8,
    Uint16: ThymeWriter.writeUint16,
    Uint32: ThymeWriter.writeUint32,
    Float32: ThymeWriter.writeFloat32,
    Float64: ThymeWriter.writeFloat64,
    Vector2: ThymeWriter.writeVector2,
    Vector3: ThymeWriter.writeVector3,
    Vector4: ThymeWriter.writeVector4,
    Matrix3x3: ThymeWriter.writeMatrix3x3,
    Matrix4x4: ThymeWriter.writeMatrix4x4
};

const THYME_READ_CONSTANTS = {
    Int8: ThymeReader.readInt8,
    Int16: ThymeReader.readInt16,
    Int32: ThymeReader.readInt32,
    Uint8: ThymeReader.readUint8,
    Uint16: ThymeReader.readUint16,
    Uint32: ThymeReader.readUint32,
    Float32: ThymeReader.readFloat32,
    Float64: ThymeReader.readFloat64,
    Vector2: ThymeReader.readVector2,
    Vector3: ThymeReader.readVector3,
    Vector4: ThymeReader.readVector4,
    Matrix3x3: ThymeReader.readMatrix3x3,
    Matrix4x4: ThymeReader.readMatrix4x4
};

class ThymeError extends Error {
    constructor(message) {
        super(message);
        this.name = "ThymeError";
    }
}

class Thyme {
    altoMare = new AltoMare();

    constructor() {
        this.altoMare.register("block", [ThymeBlock]);
        ThymeRegistry.altoMare = this.altoMare;
    }

    register(type, items) {
        checkParams(arguments, ["string", "object"]);

        if (!items || !Array.isArray(items)) throw new Error("Invalid items provided for registration");
        const handlers = {
            schema: ThymeRegistry.registerSchemas,
            builder: ThymeRegistry.registerBuilders,
            codec: ThymeRegistry.registerCodecs,
            plugin: ThymeRegistry.registerPlugins
        };

        const handler = handlers[type];
        if (!handler) throw new Error(`Unknown registration type: ${type}`);
        handler.call(ThymeRegistry, items);
    }

    schematicWrite(schemaName, parameterData) {
        const { errors, data } = this.altoMare.process(schemaName, parameterData, { thymeMode: "write" }).get("thyme");
        if (errors.length) throw new ThymeError(`Encountered errors while writing with schematic.\n ${errors.join("\n")}`);
        return data;
    }

    schematicRead(schemaName, data) {
        const result = this.altoMare.process(schemaName, data, { thymeMode: "read" });
        return result.get("thyme").data;
    }

    static builderRead(builderName, dataView, posRef) {
        const builder = ThymeRegistry.builders.get(builderName);
        if (!builder) throw new Error(`Unknown builder: ${builderName}`);
        return builder.read(dataView, posRef);
    }

    static builderWrite(builderName, dataView, data, posRef) {
        const builder = ThymeRegistry.builders.get(builderName);
        if (!builder) throw new Error(`Unknown builder: ${builderName}`);
        return builder.write(dataView, posRef, data);
    }

    static read(type, buffer, posRef) {
        if (!(buffer instanceof DataView)) throw new Error("Invalid data provided for read");

        const handler = THYME_READ_CONSTANTS[type];
        if (!handler) throw new Error(`Unknown write handler: ${type}`);
        return handler(buffer, posRef);
    }

    static write(type, buffer, data, posRef) {
        if (!data) throw new Error("No data provided for write");
        if (!(buffer instanceof DataView)) throw new Error("Invalid data provided for write");

        const handler = THYME_WRITE_CONSTANTS[type];
        if (!handler) throw new Error(`Unknown write handler: ${type}`);
        return handler(buffer, posRef, data);
    }
}

export {
    Thyme,
    THYME_READ_CONSTANTS,
    THYME_WRITE_CONSTANTS,
    ThymeReader,
    ThymeWriter,
    ThymeUtilities,
    ThymeRegistry
};