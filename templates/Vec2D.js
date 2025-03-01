const Vec2D = {
    /**
     * Creates a new Vec2D object
     * @param {number} [x=0] - The x coordinate
     * @param {number} [y=0] - The y coordinate
     * @returns {{x: number, y: number}} A new Vec2D object
     */
    spawn(x = 0, y = 0) {
        return { x, y };
    },

    add(vec, other) {
        vec.x += other.x;
        vec.y += other.y;
        return vec;
    },

    sub(vec, other) {
        vec.x -= other.x;
        vec.y -= other.y;
        return vec;
    },

    mul(vec, scalar) {
        vec.x *= scalar;
        vec.y *= scalar;
        return vec;
    },

    div(vec, scalar) {
        vec.x /= scalar;
        vec.y /= scalar;
        return vec;
    },

    dot(vec, other) {
        return vec.x * other.x + vec.y * other.y;
    },

    mag(vec) {
        return Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    },

    normalize(vec) {
        const mag = this.mag(vec);
        if (mag !== 0) {
            this.div(vec, mag);
        }
        return vec;
    },

    setMag(vec, magnitude) {
        return this.normalize(vec).mul(vec, magnitude);
    },

    limit(vec, max) {
        if (this.mag(vec) > max) {
            this.normalize(vec);
            this.mul(vec, max);
        }
        return vec;
    },

    dist(vec, other) {
        const dx = vec.x - other.x;
        const dy = vec.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    },

    copy(vec, other) {
        vec.x = other.x;
        vec.y = other.y;
        return vec;
    },

    clone(vec) {
        return this.spawn(vec.x, vec.y);
    }
};

export default Vec2D;
