import { skip } from "./Utilities.js";

function writeInt8(dataView, posRef, value) {
    dataView.setInt8(posRef.offset, value);
    skip(dataView.buffer, posRef, 1);
    return dataView.buffer;
}

function writeUint8(dataView, posRef, value) {
    dataView.setUint8(posRef.offset, value);
    skip(dataView.buffer, posRef, 1);
    return dataView.buffer;
}

function writeInt16(dataView, posRef, value) {
    dataView.setInt16(posRef.offset, value);
    skip(dataView.buffer, posRef, 2);
    return dataView.buffer;
}

function writeUint16(dataView, posRef, value) {
    dataView.setUint16(posRef.offset, value);
    skip(dataView.buffer, posRef, 2);
    return dataView.buffer;
}

function writeInt32(dataView, posRef, value) {
    dataView.setInt32(posRef.offset, value);
    skip(dataView.buffer, posRef, 4);
    return dataView.buffer;
}

function writeUint32(dataView, posRef, value) {
    dataView.setUint32(posRef.offset, value);
    skip(dataView.buffer, posRef, 4);
    return dataView.buffer;
}

function writeFloat32(dataView, posRef, value) {
    const roundedValue = Number(value.toPrecision(7));
    dataView.setFloat32(posRef.offset, roundedValue);
    skip(dataView.buffer, posRef, 4);
    return dataView.buffer;
}

function writeFloat64(dataView, posRef, value) {
    dataView.setFloat64(posRef.offset, value);
    skip(dataView.buffer, posRef, 8);
    return dataView.buffer;
}

function writeVector2(dataView, posRef, vector) {
    writeFloat32(dataView, posRef, { value: vector.x });
    writeFloat32(dataView, posRef, { value: vector.y });
    return dataView.buffer;
}

function writeVector3(dataView, posRef, vector) {
    writeFloat32(dataView, posRef, { value: vector.x });
    writeFloat32(dataView, posRef, { value: vector.y });
    writeFloat32(dataView, posRef, { value: vector.z });
    return dataView.buffer;
}

function writeVector4(dataView, posRef, vector) {
    writeFloat32(dataView, posRef, { value: vector.x });
    writeFloat32(dataView, posRef, { value: vector.y });
    writeFloat32(dataView, posRef, { value: vector.z });
    writeFloat32(dataView, posRef, { value: vector.w });
    return dataView.buffer;
}

function writeMatrix3x3(dataView, posRef, matrix) {
    for (let i = 0; i < 9; i++) writeFloat32(dataView, posRef, { value: matrix[i] });
    return dataView.buffer;
}

function writeMatrix4x4(dataView, posRef, matrix) {
    for (let i = 0; i < 16; i++) writeFloat32(dataView, posRef, { value: matrix[i] });
    return dataView.buffer;
}

export {
    writeInt8,
    writeUint8,
    writeInt16,
    writeUint16,
    writeInt32,
    writeUint32,
    writeFloat32,
    writeFloat64,
    writeVector2,
    writeVector3,
    writeVector4,
    writeMatrix3x3,
    writeMatrix4x4
}