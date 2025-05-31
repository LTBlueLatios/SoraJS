/**
 * Hashes a string using a simple, non-secure hash algorithm.
 * @param {string} string - The string to hash.
 * @returns {number} - The hash value.
 */
function hashString(string) {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
        hash = (hash << 5) - hash + string.charCodeAt(i);
        hash |= 0;
    }
    return hash >>> 0;
}

/**
 * Securely hashes a string using the SubtleCrypto API and Sha256 algorithm.
 * @param {*} string
 * @returns {Promise<string>} - The SHA-256 hash of the string in hexadecimal format.
 */
async function secureHashString(string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(string);

    const result = await crypto.subtle
        .digest("SHA-256", data)
        .then((hashBuffer) => {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");

            return hashHex;
        })
        .catch((error) => {
            console.error("Error hashing string:", error);
            return null;
        });

    return result;
}

/**
 * Generates an 8 digit nonce using the Crypto API
 * @param {number} [randomness=4] - The number of random bytes to generate (default is 4).
 * @returns {string} An 8 digit hexadecimal nonce.
 */
function generateNonce(randomness = 4) {
    const array = new Uint8Array(randomness);
    crypto.getRandomValues(array);

    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
        "",
    );
}

export { hashString, secureHashString, generateNonce };
