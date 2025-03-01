import Vec2D from "./Vec2D.js";

class SpatialHash {
    #occupiedCells = new Map();
    #entities = new Map();
    #sizes;

    constructor(sizes) {
        this.#sizes = {
            region: sizes.regionSize || 1000,
            chunk: sizes.chunkSize || 100
        };
    }

    #getCellKey(coordinate) {
        return `${coordinate.region.x},${coordinate.region.y}:${coordinate.chunk.x},${coordinate.chunk.y}`;
    }

    #fromPosition(position, regionSize, chunkSize) {
        return {
            region: Vec2D.spawn(
                Math.floor(position.x / regionSize),
                Math.floor(position.y / regionSize)
            ),
            chunk: Vec2D.spawn(
                Math.floor((position.x % regionSize) / chunkSize),
                Math.floor((position.y % regionSize) / chunkSize)
            ),
            local: Vec2D.spawn(
                position.x % chunkSize,
                position.y % chunkSize
            )
        };
    }

    insert(object) {
        const coordinate = this.#fromPosition(
            object.position,
            this.#sizes.region,
            this.#sizes.chunk
        );

        const cellKey = this.#getCellKey(coordinate);

        if (!this.#occupiedCells.has(cellKey)) {
            this.#occupiedCells.set(cellKey, {
                objects: new Set()
            });
        }

        const cell = this.#occupiedCells.get(cellKey);
        cell.objects.add(object);

        this.#entities.set(object, {
            coordinate,
            cellKey
        });
    }

    remove(object) {
        const entry = this.#entities.get(object);
        if (!entry) return;

        const cell = this.#occupiedCells.get(entry.cellKey);
        if (cell) {
            cell.objects.delete(object);
            if (cell.objects.size === 0) {
                this.#occupiedCells.delete(entry.cellKey);
            }
        }

        this.#entities.delete(object);
    }

    update(object) {
        const oldEntry = this.#entities.get(object);
        if (!oldEntry) return;

        const newCoordinate = this.#fromPosition(
            object.position,
            this.#sizes.region,
            this.#sizes.chunk
        );

        const newCellKey = this.#getCellKey(newCoordinate);

        if (newCellKey !== oldEntry.cellKey) {
            this.remove(object);
            this.insert(object);
        }
    }

    query(position, radius) {
        const results = new Set();
        const centerCoord = this.#fromPosition(
            position,
            this.#sizes.region,
            this.#sizes.chunk
        );

        const searchRadius = Math.ceil(radius / this.#sizes.chunk);

        // Loop through candidate cells based on hierarchical coordinates.
        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
            for (let dy = -searchRadius; dy <= searchRadius; dy++) {
                const searchCoord = {
                    region: Vec2D.spawn(centerCoord.region.x, centerCoord.region.y),
                    chunk: Vec2D.spawn(centerCoord.chunk.x + dx, centerCoord.chunk.y + dy),
                    local: Vec2D.spawn(0, 0)
                };

                const cellKey = this.#getCellKey(searchCoord);
                const cell = this.#occupiedCells.get(cellKey);

                // Compute the cell's global bounding box.
                const cellMinX = searchCoord.region.x * this.#sizes.region +
                                 searchCoord.chunk.x * this.#sizes.chunk;
                const cellMinY = searchCoord.region.y * this.#sizes.region +
                                 searchCoord.chunk.y * this.#sizes.chunk;
                const cellMaxX = cellMinX + this.#sizes.chunk;
                const cellMaxY = cellMinY + this.#sizes.chunk;

                // Calculate the minimum distance from the query point to the cell's AABB.
                let dxToCell = 0;
                if (position.x < cellMinX) dxToCell = cellMinX - position.x;
                else if (position.x > cellMaxX) dxToCell = position.x - cellMaxX;

                let dyToCell = 0;
                if (position.y < cellMinY) dyToCell = cellMinY - position.y;
                else if (position.y > cellMaxY) dyToCell = position.y - cellMaxY;

                const cellDistance = Math.hypot(dxToCell, dyToCell);

                // Skip this cell entirely if its bounding box is farther than the query radius.
                if (cellDistance > radius) continue;

                // Now test each object in the cell using the full global position.
                if (cell) {
                    for (const object of cell.objects) {
                        const distance = Math.hypot(
                            object.position.x - position.x,
                            object.position.y - position.y
                        );

                        if (distance <= radius) {
                            results.add(object);
                        }
                    }
                }
            }
        }

        return results;
    }

    raytrace() {
        // Return a group of cells that the ray passes through
        // Don't modify
    }
}

export default SpatialHash;