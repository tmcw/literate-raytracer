const negInfinity = [-Infinity, -Infinity, -Infinity] as Matrix3_1;
const posInfinity = [Infinity, Infinity, Infinity] as Matrix3_1;

class BBox {
    static readonly negInfinity = [-Infinity, -Infinity, -Infinity] as Matrix3_1;
    static readonly posInfinity = [Infinity, Infinity, Infinity] as Matrix3_1;
    static create() {
        return new BBox();
    }
    bounds: [Matrix3_1, Matrix3_1] = [BBox.negInfinity, BBox.posInfinity];
    constructor(min = BBox.negInfinity, max = BBox.posInfinity) {
        this.bounds[0] = min;
        this.bounds[1] = max;
    }
    centroid() {
        return [
            (this.bounds[0][0] + this.bounds[1][0]) * 0.5,
            (this.bounds[0][1] + this.bounds[1][1]) * 0.5,
            (this.bounds[0][2] + this.bounds[1][2]) * 0.5,
        ] as Matrix3_1;
    }
    extendBy(p: Matrix3_1) {
        if (p[0] < this.bounds[0][0]) { this.bounds[0][0] = p[0]; } 
        if (p[1] < this.bounds[0][1]) { this.bounds[0][1] = p[1]; } 
        if (p[2] < this.bounds[0][2]) { this.bounds[0][2] = p[2]; } 
        if (p[0] > this.bounds[1][0]) { this.bounds[1][0] = p[0]; } 
        if (p[1] > this.bounds[1][1]) { this.bounds[1][1] = p[1]; } 
        if (p[2] > this.bounds[1][2]) { this.bounds[1][2] = p[2]; } 

        return this;
    }
    min() {
        return this.bounds[0];
    }
    max() {
        return this.bounds[1];
    }
}

class Extents {
    static create(numPlaneSetNormals = 7, op = createObjectPool(createMatrix3_1)) {
        return new Extents(numPlaneSetNormals, op);
    }

    d: ([number, number])[] = [];
    constructor(private readonly numPlaneSetNormals = 7, private op = createObjectPool(createMatrix3_1)) {
        for (let i = 0; i < numPlaneSetNormals; ++i) {
            this.d[i] = [Infinity, -Infinity];
        }
    }

    extendBy(e: Extents): void {
        for (let i = 0; i < this.numPlaneSetNormals; ++i) {
            if (e.d[i][0] < this.d[i][0]) {
                this.d[i][0] = e.d[i][0];
            }
            if (e.d[i][1] > this.d[i][1]) {
                this.d[i][1] = e.d[i][1]; 
            }
        }
    }

    centroid() {
        const ret = this.op.malloc();
        
        ret[0] = this.d[0][0] + this.d[0][1] * 0.5;
        ret[1] = this.d[1][0] + this.d[1][1] * 0.5;
        ret[2] = this.d[2][0] + this.d[2][1] * 0.5;

        return ret;
    }
}



type NOctreeNode = null | OctreeNode;
class OctreeNode {
    static create() {
        return new OctreeNode();
    }

    child: [NOctreeNode, NOctreeNode, NOctreeNode, NOctreeNode, NOctreeNode, NOctreeNode, NOctreeNode, NOctreeNode] = [
        null, null, null, null, null, null, null, null,
    ];
    isLeaf = true;
    nodeExtents = Extents.create();
    nodeExtentsList: Extents[] = [];
}

class Octree {
    static readonly MAX_DEPTH = 16;
    static create(sceneExtents: Extents) {
        return new Octree(sceneExtents);
    }

    bbox = BBox.create();
    root = OctreeNode.create();
    constructor(sceneExtents: Extents) {
        const xDiff = sceneExtents.d[0][1] - sceneExtents.d[0][0];
        const yDiff = sceneExtents.d[1][1] - sceneExtents.d[1][0];
        const zDiff = sceneExtents.d[2][1] - sceneExtents.d[2][0];
        const maxDiff = Math.max(xDiff, Math.max(yDiff, zDiff));
        const minPlusMax = [
            sceneExtents.d[0][0] + sceneExtents.d[0][1],
            sceneExtents.d[1][0] + sceneExtents.d[1][1],
            sceneExtents.d[2][0] + sceneExtents.d[2][1],
        ] as Matrix3_1;
        this.bbox.bounds[0][0] = (minPlusMax[0] - maxDiff) * 0.5;
        this.bbox.bounds[0][1] = (minPlusMax[1] - maxDiff) * 0.5;
        this.bbox.bounds[0][2] = (minPlusMax[2] - maxDiff) * 0.5;
        this.bbox.bounds[1][0] = (minPlusMax[0] + maxDiff) * 0.5;
        this.bbox.bounds[1][1] = (minPlusMax[1] + maxDiff) * 0.5;
        this.bbox.bounds[1][2] = (minPlusMax[2] + maxDiff) * 0.5;

    }

    private _build(node: OctreeNode, bbox: BBox) {
        if (node.isLeaf) {
            node.nodeExtentsList.forEach((e) => {
                node.nodeExtents.extendBy(e);
            });
        } else {
            for (let i = 0; i < 8; ++i) {
                const child = node.child[i];
                if (child) {
                    const childBBox = BBox.create();;
                    const centroid = bbox.centroid();
                    // x-axis
                    childBBox.bounds[0][0] = (i & 4) ? centroid[0] : bbox.bounds[0][0];
                    childBBox.bounds[1][0] = (i & 4) ? bbox.bounds[1][0] : centroid[0];
                    // y-axis
                    childBBox.bounds[0][1] = (i & 2) ? centroid[1] : bbox.bounds[0][1];
                    childBBox.bounds[1][1] = (i & 2) ? bbox.bounds[1][1] : centroid[1];
                    // z-axis
                    childBBox.bounds[0][2] = (i & 1) ? centroid[2] : bbox.bounds[0][2];
                    childBBox.bounds[1][2] = (i & 1) ? bbox.bounds[1][2] : centroid[2];

                    // Inspect child
                    this._build(child, childBBox);

                    // Expand extents with extents of child
                    node.nodeExtents.extendBy(child.nodeExtents);
                }
            }
        }
    }

    private _insert(node: OctreeNode, extents: Extents, bbox: BBox, depth: number) {
        if (node.isLeaf) {
            if (node.nodeExtentsList.length === 0 || depth === Octree.MAX_DEPTH) {
                node.nodeExtentsList.push(extents);
            } else {
                node.isLeaf = false;
                // Re-insert extents held by this node
                while (node.nodeExtentsList.length) {
                    const ne = node.nodeExtentsList.pop();
                    if (!ne) { break; }
                    this._insert(node, ne, bbox, depth);
                }
                // Insert new extent
                this._insert(node, extents, bbox, depth);
            }
        } else {
            // Need to compute in which child of the current node this extents should
            // be inserted into
            const extentsCentroid = extents.centroid();
            const nodeCentroid = [
                (bbox.bounds[0][0] + bbox.bounds[1][0]) * 0.5,
                (bbox.bounds[0][1] + bbox.bounds[1][1]) * 0.5,
                (bbox.bounds[0][2] + bbox.bounds[1][2]) * 0.5,
            ];
            let childBBox = BBox.create();
            let childIndex = 0;
            // x-axis
            if (extentsCentroid[0] > nodeCentroid[0]) {
                childIndex = 4;
                childBBox.bounds[0][0] = nodeCentroid[0];
                childBBox.bounds[1][0] = bbox.bounds[1][0];
            } else {
                childBBox.bounds[0][0] = bbox.bounds[0][0];
                childBBox.bounds[1][0] = nodeCentroid[0];
            }
            // y-axis
            if (extentsCentroid[1] > nodeCentroid[1]) {
                childIndex += 2;
                childBBox.bounds[0][1] = nodeCentroid[1];
                childBBox.bounds[1][1] = bbox.bounds[1][1];
            } else {
                childBBox.bounds[0][1] = bbox.bounds[0][1];
                childBBox.bounds[1][1] = nodeCentroid[1];
            }
            // z-axis
            if (extentsCentroid[2] > nodeCentroid[2]) {
                childIndex += 1;
                childBBox.bounds[0][2] = nodeCentroid[2];
                childBBox.bounds[1][2] = bbox.bounds[1][2];
            } else {
                childBBox.bounds[0][2] = bbox.bounds[0][2];
                childBBox.bounds[1][2] = nodeCentroid[2];
            }

            // Create the child node if it doesn't exsit yet and then insert the extents in it
            let nc = node.child[childIndex];
            if (nc === null) {
                nc = OctreeNode.create();
                node.child[childIndex] = nc;
            } 
            this._insert(nc, extents, childBBox, depth + 1);
        }
    }

    build() {
        this._build(this.root, this.bbox);
    }
    insert(extents: Extents) {
        this._insert(this.root, extents, this.bbox, 0);
    }
}
