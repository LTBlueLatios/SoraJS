import { skip } from "./Utilities.js";

function readInt8(dataView, posRef) {
    const value = dataView.getInt8(posRef.offset);
    skip(dataView.buffer, posRef, 1);
    return value;
}

function readUint8(dataView, posRef) {
    const value = dataView.getUint8(posRef.offset);
    skip(dataView.buffer, posRef, 1);
    return value;
}

function readInt16(dataView, posRef) {
    const value = dataView.getInt16(posRef.offset);
    skip(dataView.buffer, posRef, 2);
    return value;
}

function readUint16(dataView, posRef) {
    const value = dataView.getUint16(posRef.offset);
    skip(dataView.buffer, posRef, 2);
    return value;
}

function readInt32(dataView, posRef) {
    const value = dataView.getInt32(posRef.offset);
    skip(dataView.buffer, posRef, 4);
    return value;
}

function readUint32(dataView, posRef) {
    const value = dataView.getUint32(posRef.offset);
    skip(dataView.buffer, posRef, 4);
    return value;
}

function readFloat32(dataView, posRef) {
    const value = dataView.getFloat32(posRef.offset);
    skip(dataView.buffer, posRef, 4);
    // todo: check if this is actually needed
    return Number(value.toPrecision(7));
}

function readFloat64(dataView, posRef) {
    const value = dataView.getFloat64(posRef.offset);
    skip(dataView.buffer, posRef, 8);
    // todo: restore length
    return Number(value);
}

function readVector2(dataView, posRef) {
    return {
        x: readFloat32(dataView, posRef),
        y: readFloat32(dataView, posRef)
    };
}

function readVector3(dataView, posRef) {
    return {
        x: readFloat32(dataView, posRef),
        y: readFloat32(dataView, posRef),
        z: readFloat32(dataView, posRef)
    };
}

function readVector4(dataView, posRef) {
    return {
        x: readFloat32(dataView, posRef),
        y: readFloat32(dataView, posRef),
        z: readFloat32(dataView, posRef),
        w: readFloat32(dataView, posRef)
    };
}

function readMatrix3x3(dataView, posRef) {
    const matrix = new Float32Array(9);
    for (let i = 0; i < 9; i++) {
        matrix[i] = readFloat32(dataView.buffer, posRef);
    }
    return matrix;
}

function readMatrix4x4(dataView, posRef) {
    const matrix = new Float32Array(16);
    for (let i = 0; i < 16; i++) {
        matrix[i] = readFloat32(dataView.buffer, posRef);
    }
    return matrix;
}

export {
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
    readMatrix4x4
}