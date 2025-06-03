/**
 * Deeply freezes an object and all its properties.
 * @param {Object} obj - The object to be frozen.
 * @returns {Object} The frozen object.
 */
function DeepFreeze(obj) {
    if (obj && typeof obj === "object" && !Object.isFrozen(obj)) {
        Object.keys(obj).forEach((key) => {
            DeepFreeze(obj[key]);
        });
        Object.freeze(obj);
    }
    return obj;
}

/**
 * Deeply seals an object and all its properties.
 * @param {Object} obj - The object to be sealed.
 * @returns {Object} The sealed object.
 */
function DeepSeal(obj) {
    if (obj && typeof obj === "object" && !Object.isSealed(obj)) {
        Object.keys(obj).forEach((key) => {
            DeepSeal(obj[key]);
        });
        Object.seal(obj);
    }
    return obj;
}

export { DeepFreeze, DeepSeal };
