import ThymeUtilities from "./ThymeUtilities";

const ThymeWriter = {
    writeInt8(dataView, posRef, { value }) {
        dataView.setInt8(posRef.offset, value);
        ThymeUtilities.skip(dataView.buffer, posRef, 1);
        return dataView.buffer;
    },

    writeUint8(dataView, posRef, { value }) {
        dataView.setUint8(posRef.offset, value);
        ThymeUtilities.skip(dataView.buffer, posRef, 1);
        return dataView.buffer;
    },

    writeInt16(dataView, posRef, { value }) {
        dataView.setInt16(posRef.offset, value);
        ThymeUtilities.skip(dataView.buffer, posRef, 2);
        return dataView.buffer;
    },

    writeUint16(dataView, posRef, { value }) {
        dataView.setUint16(posRef.offset, value);
        ThymeUtilities.skip(dataView.buffer, posRef, 2);
        return dataView.buffer;
    },

    writeInt32(dataView, posRef, { value }) {
        dataView.setInt32(posRef.offset, value);
        ThymeUtilities.skip(dataView.buffer, posRef, 4);
        return dataView.buffer;
    },

    writeUint32(dataView, posRef, { value }) {
        dataView.setUint32(posRef.offset, value);
        ThymeUtilities.skip(dataView.buffer, posRef, 4);
        return dataView.buffer;
    },

    writeFloat32(dataView, posRef, { value }) {
        const roundedValue = Number(value.toPrecision(7));
        dataView.setFloat32(posRef.offset, roundedValue);
        ThymeUtilities.skip(dataView.buffer, posRef, 4);
        return dataView.buffer;
    },

    writeFloat64(dataView, posRef, { value }) {
        dataView.setFloat64(posRef.offset, value);
        ThymeUtilities.skip(dataView.buffer, posRef, 8);
        return dataView.buffer;
    },

    writeVector2(dataView, posRef, { vector }) {
        ThymeWriter.writeFloat32(dataView, posRef, { value: vector.x });
        ThymeWriter.writeFloat32(dataView, posRef, { value: vector.y });
        return dataView.buffer;
    },

    writeVector3(dataView, posRef, { vector }) {
        ThymeWriter.writeFloat32(dataView, posRef, { value: vector.x });
        ThymeWriter.writeFloat32(dataView, posRef, { value: vector.y });
        ThymeWriter.writeFloat32(dataView, posRef, { value: vector.z });
        return dataView.buffer;
    },

    writeVector4(dataView, posRef, { vector }) {
        ThymeWriter.writeFloat32(dataView, posRef, { value: vector.x });
        ThymeWriter.writeFloat32(dataView, posRef, { value: vector.y });
        ThymeWriter.writeFloat32(dataView, posRef, { value: vector.z });
        ThymeWriter.writeFloat32(dataView, posRef, { value: vector.w });
        return dataView.buffer;
    },

    writeMatrix3x3(dataView, posRef, { matrix }) {
        for (let i = 0; i < 9; i++) {
            ThymeWriter.writeFloat32(dataView, posRef, { value: matrix[i] });
        }
        return dataView.buffer;
    },

    writeMatrix4x4(dataView, posRef, { matrix }) {
        for (let i = 0; i < 16; i++) {
            ThymeWriter.writeFloat32(dataView, posRef, { value: matrix[i] });
        }
        return dataView.buffer;
    },

    writeString(dataView, posRef, { string }) {
        const encoded = new TextEncoder().encode(string);

        // 2 bytes for length + encoded string bytes
        const requiredSize = posRef.offset + 2 + encoded.length;
        if (dataView.byteLength < requiredSize) {
            throw new Error("DataView buffer is too small for the encoded string.");
        }

        ThymeWriter.writeUint16(dataView, posRef, { value: encoded.length });
        for (let i = 0; i < encoded.length; i++) {
            ThymeWriter.writeUint8(dataView, posRef, { value: encoded[i] });
        }
        return dataView.buffer;
    }
};


export default ThymeWriter;