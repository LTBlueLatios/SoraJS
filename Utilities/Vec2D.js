const Vec2D = {
    /**
     * Creates a new Vec2D object
     * @param {number} [x=0] - The x coordinate
     * @param {number} [y=0] - The y coordinate
     * @returns {{x: number, y: number}} A new Vec2D object
     */
    spawn(x = 0, y = 0) {
        return {
            x,
            y,
        };
    },

    /**
     * Adds two Vec2D objects
     * @param {{x: number, y: number}} vec - The first Vec2D object
     * @param {{x: number, y: number}} other - The second Vec2D object
     * @returns {{x: number, y: number}} The resulting Vec2D object
     */
    add(vec, other) {
        vec.x += other.x;
        vec.y += other.y;
        return vec;
    },

    /**
     * Subtracts two Vec2D objects
     * @param {{x: number, y: number}} vec - The first Vec2D object
     * @param {{x: number, y: number}} other - The second Vec2D object
     * @returns {{x: number, y: number}} The resulting Vec2D object
     */
    sub(vec, other) {
        vec.x -= other.x;
        vec.y -= other.y;
        return vec;
    },

    /**
     * Multiplies a Vec2D object by a scalar
     * @param {{x: number, y: number}} vec - The Vec2D object
     * @param {number} scalar - The scalar value
     * @returns {{x: number, y: number}} The resulting Vec2D object
     */
    mul(vec, scalar) {
        vec.x *= scalar;
        vec.y *= scalar;
        return vec;
    },

    /**
     * Divides a Vec2D object by a scalar
     * @param {{x: number, y: number}} vec - The Vec2D object
     * @param {number} scalar - The scalar value
     * @returns {{x: number, y: number}} The resulting Vec2D object
     */
    div(vec, scalar) {
        vec.x /= scalar;
        vec.y /= scalar;
        return vec;
    },

    /**
     * Calculates the dot product of two Vec2D objects
     * @param {{x: number, y: number}} vec - The first Vec2D object
     * @param {{x: number, y: number}} other - The second Vec2D object
     * @returns {number} The dot product of the two Vec2D objects
     */
    dot(vec, other) {
        return vec.x * other.x + vec.y * other.y;
    },

    /**
     * Calculates the magnitude of a Vec2D object
     * @param {{x: number, y: number}} vec - The Vec2D object
     * @returns {number} The magnitude of the Vec2D object
     */
    mag(vec) {
        return Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    },

    /**
     * Normalizes a Vec2D object
     * @param {{x: number, y: number}} vec - The Vec2D object
     * @returns {{x: number, y: number}} The normalized Vec2D object
     */
    normalize(vec) {
        const mag = this.mag(vec);
        if (mag !== 0) {
            this.div(vec, mag);
        }
        return vec;
    },

    /**
     * Sets the magnitude of a Vec2D object
     * @param {{x: number, y: number}} vec - The Vec2D object
     * @param {number} magnitude - The magnitude to set
     * @returns {{x: number, y: number}} The Vec2D object with the new magnitude
     */
    setMag(vec, magnitude) {
        return this.normalize(vec).mul(vec, magnitude);
    },

    /**
     * Limits the magnitude of a Vec2D object
     * @param {{x: number, y: number}} vec - The Vec2D object
     * @param {number} max - The maximum magnitude
     * @returns {{x: number, y: number}} The Vec2D object with the new magnitude
     */
    limit(vec, max) {
        if (this.mag(vec) > max) {
            this.normalize(vec);
            this.mul(vec, max);
        }
        return vec;
    },

    /**
     * Calculates the distance between two Vec2D objects
     * @param {{x: number, y: number}} vec - The first Vec2D object
     * @param {{x: number, y: number}} other - The second Vec2D object
     * @returns {number} The distance between the two Vec2D objects
     */
    dist(vec, other) {
        const dx = vec.x - other.x;
        const dy = vec.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Copies the values of one Vec2D object to another
     * @param {{x: number, y: number}} vec - The destination Vec2D object
     * @param {{x: number, y: number}} other - The source Vec2D object
     * @returns {{x: number, y: number}} The destination Vec2D object with the new values
     */
    copy(vec, other) {
        vec.x = other.x;
        vec.y = other.y;
        return vec;
    },

    /**
     * Clones a Vec2D object
     * @param {{x: number, y: number}} vec - The Vec2D object to clone
     * @returns {{x: number, y: number}} The cloned Vec2D object
     */
    clone(vec) {
        return this.spawn(vec.x, vec.y);
    },
};

export default Vec2D;
