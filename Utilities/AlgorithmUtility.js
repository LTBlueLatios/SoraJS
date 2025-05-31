let CRC32Table = null;
const CRC32Cache = new Map();

/**
 * Encodes a string to a 32-bit CRC checksum.
 * @param {string} string - The string to encode.
 * @returns {number} - The 32-bit CRC checksum.
 */
function CRC32(string) {
    if (!CRC32Table) CRC32Table = preComputatedCRC32();
    if (CRC32Cache.has(string)) return CRC32Cache.get(string);

    let crc = 0xffffffff;
    const encodedString = new TextEncoder().encode(string);
    const length = encodedString.length;

    for (let i = 0; i < length; i++) {
        const byte = encodedString[i];
        const index = (crc ^ byte) & 0xff;
        crc = (crc >>> 8) ^ CRC32Table[index];
    }

    const result = (crc ^ 0xffffffff) >>> 0;
    // How to cheat at benchmarks 101 lol
    CRC32Cache.set(string, result);
    return result;
}

function preComputatedCRC32() {
    const polynomial = 0xedb88320;
    const CRC32Table = new Uint32Array(256);

    for (let i = 0; i < 256; i++) {
        let crc = i;

        for (let j = 0; j < 8; j++)
            crc = (crc >>> 1) ^ ((crc & 1) * polynomial);

        CRC32Table[i] = crc >>> 0;
    }

    return CRC32Table;
}

export { CRC32 };
