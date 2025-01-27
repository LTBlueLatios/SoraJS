/**
 * An efficient 2D vector class using Float32Array for internal storage.
 */
class Vec2D {
    /** @type {Float32Array} Internal data storage using Float32Array */
    data;

    /**
     * Creates a new Vec2D instance
     * @param {number} [x=0] - The x coordinate
     * @param {number} [y=0] - The y coordinate
     */
    constructor(x = 0, y = 0) {
        this.data = new Float32Array([x, y]);
    }

    /**
     * Gets the x coordinate
     * @returns {number} The x coordinate
     */
    get x() {
        return this.data[0];
    }

    /**
     * Sets the x coordinate
     * @param {number} value - The new x coordinate
     */
    set x(value) {
        this.data[0] = value;
    }

    /**
     * Gets the y coordinate
     * @returns {number} The y coordinate
     */
    get y() {
        return this.data[1];
    }

    /**
     * Sets the y coordinate
     * @param {number} value - The new y coordinate
     */
    set y(value) {
        this.data[1] = value;
    }

    /**
     * Adds another vector to this vector
     * @param {Vec2D} other - The vector to add
     * @returns {Vec2D} This vector for chaining
     */
    add(other) {
        this.data[0] += other.data[0];
        this.data[1] += other.data[1];
        return this;
    }

    /**
     * Subtracts another vector from this vector
     * @param {Vec2D} other - The vector to subtract
     * @returns {Vec2D} This vector for chaining
     */
    sub(other) {
        this.data[0] -= other.data[0];
        this.data[1] -= other.data[1];
        return this;
    }

    /**
     * Multiplies this vector by a scalar
     * @param {number} scalar - The scalar value to multiply by
     * @returns {Vec2D} This vector for chaining
     */
    mul(scalar) {
        this.data[0] *= scalar;
        this.data[1] *= scalar;
        return this;
    }

    /**
     * Divides this vector by a scalar
     * @param {number} scalar - The scalar value to divide by
     * @returns {Vec2D} This vector for chaining
     */
    div(scalar) {
        this.data[0] /= scalar;
        this.data[1] /= scalar;
        return this;
    }

    /**
     * Calculates the dot product with another vector
     * @param {Vec2D} other - The vector to calculate dot product with
     * @returns {number} The dot product
     */
    dot(other) {
        return this.data[0] * other.data[0] + this.data[1] * other.data[1];
    }

    /**
     * Calculates the magnitude (length) of this vector
     * @returns {number} The magnitude of the vector
     */
    mag() {
        return Math.sqrt(this.data[0] * this.data[0] + this.data[1] * this.data[1]);
    }

    /**
     * Normalizes this vector (makes it length 1)
     * @returns {Vec2D} This vector for chaining
     */
    normalize() {
        const mag = this.mag();
        if (mag !== 0) {
            this.div(mag);
        }
        return this;
    }

    /**
     * Sets the magnitude of this vector to a specific value
     * @param {number} magnitude - The desired magnitude
     * @returns {Vec2D} This vector for chaining
     */
    setMag(magnitude) {
        return this.normalize().mul(magnitude);
    }

    /**
     * Limits the magnitude of this vector to a maximum value
     * @param {number} max - The maximum magnitude allowed
     * @returns {Vec2D} This vector for chaining
     */
    limit(max) {
        if (this.mag() > max) {
            this.normalize();
            this.mul(max);
        }
        return this;
    }

    /**
     * Calculates the Euclidean distance between this vector and another vector
     * @param {Vec2D} other - The other vector to calculate distance to
     * @returns {number} The distance between the vectors
     */
    dist(other) {
        const dx = this.data[0] - other.data[0];
        const dy = this.data[1] - other.data[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Copies values from another vector into this one
     * @param {Vec2D} other - The vector to copy from
     * @returns {Vec2D} This vector for chaining
     */
    copy(other) {
        this.data[0] = other.data[0];
        this.data[1] = other.data[1];
        return this;
    }

    /**
     * Creates a new vector with the same values as this one
     * @returns {Vec2D} A new vector with the same x and y values
     */
    clone() {
        return new Vec2D(this.data[0], this.data[1]);
    }
}

export default Vec2D;