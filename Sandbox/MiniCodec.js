/**
 * MiniCodec - A lightweight, customizable data encoder/decoder for efficient data serialization.
 * Made for the Sora.js Library.
 * 
 * @class
 * @module MiniCodec
 * @exports MiniCodec
 * 
 * @description
 * MiniCodec provides methods for encoding and decoding structured data 
 * using customizable codecs.
 * 
 * @example
 * const codec = new MiniCodec();
 * codec.register('user', UserCodec);
 * 
 * const userData = {
 *     id: 123,
 *     name: 'Alice',
 *     profile: {
 *         age: 30,
 *         email: 'alice@example.com',
 *         preferences: {
 *             theme: 'dark',
 *             notifications: true
 *         }
 *     }
 * };
 * 
 * const encoded = codec.encode('user', userData);
 * console.log('Encoded Data:', encoded);
 * 
 * const decoded = codec.decode('user', encoded);
 * console.log('Decoded Data:', decoded);
 * 
 * @version 1.0.0
 * @author BlueLatios
 * @license AGPL
 * 
 * @todo Add interop with shape checking, AltoMare
 * @todo Add type checking with AltoMare (this bozo really is holding everyone up lmao)
 */
class MiniCodec {
    #codecs = new Map();

    /**
     * Registers a new data type with its codec object (which contains shape, encoder, and decoder)
     * @param {string} type - Unique identifier for this data type
     * @param {Object} codec - Object literal containing shape, encoder, and decoder
     */
    register(type, codec) {
        if (this.#codecs.has(type)) {
            throw new Error(`Type ${type} is already registered`);
        }

        const {
            shape,
            encode,
            decode
        } = codec;

        if (!shape || typeof encode !== 'function' || typeof decode !== 'function') {
            throw new Error('Codec object must contain a shape, encoder, and decoder');
        }

        this.#codecs.set(type, codec);
    }

    /**
     * Encodes data using the codec's encoder
     * @param {string} type - Type identifier
     * @param {Object} data - Data to encode
     * @returns {number[]} Encoded data
     */
    encode(type, data) {
        if (data === undefined || data === null) {
            throw new Error('Data cannot be null or undefined');
        }
        const codec = this.#getCodec(type);
        return codec.encode(data);
    }

    /**
     * Decodes data using the codec's decoder
     * @param {string} type - Type identifier
     * @param {number[]} encoded - Encoded data
     * @returns {Object} Decoded data
     */
    decode(type, encoded) {
        if (!Array.isArray(encoded)) {
            throw new Error('Encoded data must be a non-null array');
        }
        const codec = this.#getCodec(type);
        return codec.decode(encoded);
    }

    #getCodec(type) {
        const codec = this.#codecs.get(type);
        if (!codec) {
            throw new Error(`No codec registered for type ${type}`);
        }

        return codec
    }

    /**
     * Encodes a string into an array of character codes with a sentinel value.
     * @param {string} string - The string to encode.
     * @returns {number[]} The encoded array with character codes and a -1 sentinel for the end of the string.
     */
    static encodeString(string) {
        return [
            ...Array.from(string).map(c => c.charCodeAt(0)),
            -1
        ];
    }

    /**
     * Decodes an encoded array into a string, reading from a position until an END_OF_STRING sentinel (-1).
     *
     * @param {number[]} encoded - The array of character codes to decode.
     * @param {Object} posRef - A reference object containing the current position in the encoded array.
     * @param {number} posRef.pos - The current position in the encoded array
     * @returns {string} The decoded string.
     */
    static readString(encoded, posRef) {
        let str = '';
        while (encoded[posRef.pos] !== -1) {
            str += String.fromCharCode(encoded[posRef.pos]);
            posRef.pos++;
        }
        posRef.pos++;
        return str;
    }
}

export default MiniCodec;