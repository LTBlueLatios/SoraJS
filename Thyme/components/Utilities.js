
function getBuffer(buffer, { offset }) {
    return new Uint8Array(buffer, 0, offset);
}

function seek(buffer, posRef, offset) {
    if (offset < 0 || offset > buffer.byteLength) {
        throw new Error("Offset out of bounds");
    }
    posRef.offset = offset;
}

function skip(buffer, posRef, bytes) {
    const newOffset = posRef.offset + bytes;
    if (newOffset < 0 || newOffset > buffer.byteLength) {
        throw new Error("Skip would move offset out of bounds");
    }
    posRef.offset = newOffset;
}

function align(buffer, posRef, alignment) {
    const remainder = posRef.offset % alignment;
    if (remainder !== 0) {
        this.skip(buffer, posRef, alignment - remainder);
    }
}

function getRemainingBytes(buffer, { offset }) {
    return buffer.byteLength - offset;
}

function hasMoreData(buffer, { offset }) {
    return offset < buffer.byteLength;
}

export {
    getBuffer,
    seek,
    skip,
    align,
    getRemainingBytes,
    hasMoreData
};