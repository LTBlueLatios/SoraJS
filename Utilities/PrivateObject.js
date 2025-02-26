export function createPrivateObject(initialState = {}) {
    const privateState = {
        ...initialState
    };
    const publicState = {};

    const handler = {
        get(target, prop) {
            if (typeof target[prop] === "function") {
                return function(...args) {
                    return target[prop].apply(this, [privateState, ...args]);
                };
            }
            return target[prop];
        }
    };

    return {
        addPrivateProperty(key, value) {
            privateState[key] = value;
            return this;
        },

        addPublicProperty(key, value) {
            publicState[key] = value;
            return this;
        },

        addPublicMethod(key, fn) {
            publicState[key] = fn;
            return this;
        },

        build() {
            return new Proxy(publicState, handler);
        }
    };
}

export default createPrivateObject;