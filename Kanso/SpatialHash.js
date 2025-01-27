/**
 * @typedef {Object} Vector2D
 * @property {number} x - The x coordinate
 * @property {number} y - The y coordinate
 */

/**
 * @typedef {Object} SpatialObject
 * @property {Vector2D} position - The position of the object
 * @property {number} radius - The radius of the object
 */

/**
 * A spatial hashing system for efficient 2D collision detection and spatial queries.
 * Divides space into a grid of cells and tracks which objects occupy which cells.
 */
class SpatialHash {
    /**
     * Map of cell coordinates to sets of objects occupying those cells.
     * @type {Map<string, Set<SpatialObject>>}
     */
    occupiedCells = new Map();

    /**
     * Map of objects to the set of cell coordinates they occupy.
     * @type {Map<SpatialObject, Set<string>>}
     */
    objectCells = new Map();

    /**
     * The size of each cell in the spatial hash grid.
     * @type {number}
     */
    cellSize = 0;

    /**
     * Creates a new SpatialHash instance.
     * @param {number} cellSize - The size of each cell in the grid
     */
    constructor(cellSize) {
        this.cellSize = cellSize;
    }

    /**
     * Calculates all cells that a circular shape intersects with.
     * @param {Vector2D} position - The center position of the shape
     * @param {number} radius - The radius of the shape
     * @returns {Set<string>} Set of cell coordinates as strings in "x,y" format
     */
    getCellsForShape(position, radius) {
        const cells = new Set();

        const minX = Math.floor((position.x - radius) / this.cellSize);
        const maxX = Math.floor((position.x + radius) / this.cellSize);
        const minY = Math.floor((position.y - radius) / this.cellSize);
        const maxY = Math.floor((position.y + radius) / this.cellSize);

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                if (this.shapeIntersectsCell(position, radius, x, y)) {
                    cells.add(`${x},${y}`);
                }
            }
        }

        return cells;
    }

    /**
     * Determines if a circular shape intersects with a specific cell.
     * @param {Vector2D} position - The center position of the shape
     * @param {number} radius - The radius of the shape
     * @param {number} cellX - The x coordinate of the cell
     * @param {number} cellY - The y coordinate of the cell
     * @returns {boolean} True if the shape intersects with the cell
     */
    shapeIntersectsCell(position, radius, cellX, cellY) {
        const cellLeft = cellX * this.cellSize;
        const cellRight = (cellX + 1) * this.cellSize;
        const cellTop = cellY * this.cellSize;
        const cellBottom = (cellY + 1) * this.cellSize;

        const closestX = Math.max(cellLeft, Math.min(position.x, cellRight));
        const closestY = Math.max(cellTop, Math.min(position.y, cellBottom));

        const dx = position.x - closestX;
        const dy = position.y - closestY;
        return (dx * dx + dy * dy) <= (radius * radius);
    }

    /**
     * Inserts an object into the spatial hash.
     * @param {SpatialObject} object - The object to insert
     * @returns {void}
     */
    insert(object) {
        if (object.radius > this.cellSize * 2)
            console.warn("Shape radius is significantly larger than cell size. Consider increasing cell size for better performance.");

        const cells = this.getCellsForShape(object.position, object.radius);

        for (const cellKey of cells) {
            if (!this.occupiedCells.has(cellKey))
                this.occupiedCells.set(cellKey, new Set());
            const cell = this.occupiedCells.get(cellKey);
            if (cell)
                cell.add(object);
        }

        this.objectCells.set(object, cells);
    }

    /**
     * Removes an object from the spatial hash.
     * @param {SpatialObject} object - The object to remove
     * @returns {void}
     */
    remove(object) {
        const cells = this.objectCells.get(object);
        if (cells) {
            for (const cellKey of cells) {
                const cell = this.occupiedCells.get(cellKey);
                if (cell) {
                    cell.delete(object);
                    if (cell.size === 0) {
                        this.occupiedCells.delete(cellKey);
                    }
                }
            }
            this.objectCells.delete(object);
        }
    }

    /**
     * Updates an object's position in the spatial hash.
     * @param {SpatialObject} object - The object to update
     * @returns {void}
     */
    update(object) {
        const newCells = this.getCellsForShape(object.position, object.radius);
        const currentCells = this.objectCells.get(object);

        if (currentCells && this.sameCells(newCells, currentCells))
            return;

        this.remove(object);
        this.insert(object);
    }

    /**
     * Compares two sets of cells to determine if they are identical.
     * @param {Set<string>} cells1 - First set of cells
     * @param {Set<string>} cells2 - Second set of cells
     * @returns {boolean} True if both sets contain the same cells
     */
    sameCells(cells1, cells2) {
        if (cells1.size !== cells2.size)
            return false;

        for (const cell of cells1) {
            if (!cells2.has(cell))
                return false;
        }

        return true;
    }
}

export default SpatialHash;
