import ThymeUtilities from "./ThymeUtilities.js";

const ThymeReader = {
    readInt8(dataView, posRef) {
        const value = dataView.getInt8(posRef.offset);
        ThymeUtilities.skip(dataView.buffer, posRef, 1);
        return value;
    },

    readUint8(dataView, posRef) {
        const value = dataView.getUint8(posRef.offset);
        ThymeUtilities.skip(dataView.buffer, posRef, 1);
        return value;
    },

    readInt16(dataView, posRef) {
        const value = dataView.getInt16(posRef.offset);
        ThymeUtilities.skip(dataView.buffer, posRef, 2);
        return value;
    },

    readUint16(dataView, posRef) {
        const value = dataView.getUint16(posRef.offset);
        ThymeUtilities.skip(dataView.buffer, posRef, 2);
        return value;
    },

    readInt32(dataView, posRef) {
        const value = dataView.getInt32(posRef.offset);
        ThymeUtilities.skip(dataView.buffer, posRef, 4);
        return value;
    },

    readUint32(dataView, posRef) {
        const value = dataView.getUint32(posRef.offset);
        ThymeUtilities.skip(dataView.buffer, posRef, 4);
        return value;
    },

    readFloat32(dataView, posRef) {
        const value = dataView.getFloat32(posRef.offset);
        ThymeUtilities.skip(dataView.buffer, posRef, 4);
        // todo: check if this is actually needed
        return Number(value.toPrecision(7));
    },

    readFloat64(dataView, posRef) {
        const value = dataView.getFloat64(posRef.offset);
        ThymeUtilities.skip(dataView.buffer, posRef, 8);
        // todo: restore length
        return Number(value);
    },

    readVector2(dataView, posRef) {
        return {
            x: ThymeReader.readFloat32(dataView, posRef),
            y: ThymeReader.readFloat32(dataView, posRef)
        };
    },

    readVector3(dataView, posRef) {
        return {
            x: ThymeReader.readFloat32(dataView, posRef),
            y: ThymeReader.readFloat32(dataView, posRef),
            z: ThymeReader.readFloat32(dataView, posRef)
        };
    },

    readVector4(dataView, posRef) {
        return {
            x: ThymeReader.getFloat32(dataView, posRef),
            y: ThymeReader.getFloat32(dataView, posRef),
            z: ThymeReader.getFloat32(dataView, posRef),
            w: ThymeReader.getFloat32(dataView, posRef)
        };
    },

    readMatrix3x3(dataView, posRef) {
        const matrix = new Float32Array(9);
        for (let i = 0; i < 9; i++) {
            matrix[i] = ThymeReader.readFloat32(dataView.buffer, posRef);
        }
        return matrix;
    },

    readMatrix4x4(dataView, posRef) {
        const matrix = new Float32Array(16);
        for (let i = 0; i < 16; i++) {
            matrix[i] = ThymeReader.readFloat32(dataView.buffer, posRef);
        }
        return matrix;
    },

    readString(dataView, posRef) {
        const length = ThymeReader.readUint16(dataView, posRef);
        const bytes = new Uint8Array(dataView.buffer, posRef.offset, length);
        ThymeUtilities.skip(dataView.buffer, posRef, length);
        return new TextDecoder().decode(bytes);
    }
}

export const {
    readInt8,
    readUint8,
    readInt16,
    readUint16,
    readInt32,
    readUint32,
    readFloat32,
    readFloat64,
    readVector2,
    readVector3,
    readVector4,
    readMatrix3x3,
    readMatrix4x4,
    readString
} = ThymeReader;