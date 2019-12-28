// # Vector Operations
//
// These are general-purpose functions that deal with vectors - in this case,
// three-dimensional vectors represented as objects in the form
//
//     { x, y, z }
//
// Since we're not using traditional object oriented techniques, these
// functions take and return that sort of logic-less object, so you'll see
// `add(a, b)` rather than `a.add(b)`.

class Vector {
    // # Constants
    static UP: Vector = { x: 0, y: 1, z: 0 };
    static ZERO: Vector = { x: 0, y: 0, z: 0 };
    static WHITE: Vector = { x: 255, y: 255, z: 255 };
    static ZEROcp() {
        return { x: 0, y: 0, z: 0 };
    };
    static create(x: number, y: number, z: number) {
        return new Vector(x, y, z);
    }
    // # Operations
    //
    // ## [Dot Product](https://en.wikipedia.org/wiki/Dot_product)
    // is different than the rest of these since it takes two vectors but
    // returns a single number value.
    static dotProduct(a: Vector, b: Vector) {
        return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
    };

    // ## [Cross Product](https://en.wikipedia.org/wiki/Cross_product)
    //
    // generates a new vector that's perpendicular to both of the vectors
    // given.
    static crossProduct(a: Vector, b: Vector): Vector {
        return {
            x: (a.y * b.z) - (a.z * b.y),
            y: (a.z * b.x) - (a.x * b.z),
            z: (a.x * b.y) - (a.y * b.x)
        };
    };

    // Enlongate or shrink a vector by a factor of `t`
    static scale(a: Vector, t: number): Vector {
        return {
            x: a.x * t,
            y: a.y * t,
            z: a.z * t
        };
    };

    // ## [Unit Vector](http://en.wikipedia.org/wiki/Unit_vector)
    //
    // Turn any vector into a vector that has a magnitude of 1.
    //
    // If you consider that a [unit sphere](http://en.wikipedia.org/wiki/Unit_sphere)
    // is a sphere with a radius of 1, a unit vector is like a vector from the
    // center point (0, 0, 0) to any point on its surface.
    static unitVector(a: Vector) {
        return Vector.scale(a, 1 / Vector.len(a));
    };

    static normalize(a: Vector): Vector {
        const sum = a.x * a.x + a.y * a.y + a.z * a.z;
        return {
            x: a.x / sum,
            y: a.y / sum,
            z: a.z / sum,
        };
    }

    // Add two vectors to each other, by simply combining each
    // of their components
    static add(a: Vector, b: Vector): Vector {
        return {
            x: a.x + b.x,
            y: a.y + b.y,
            z: a.z + b.z
        };
    };

    // A version of `add` that adds three vectors at the same time. While
    // it's possible to write a clever version of `static add` that takes
    // any number of arguments, it's not fast, so we're keeping it simple and
    // just making two versions.
    static add3(a: Vector, b: Vector, c: Vector): Vector {
        return {
            x: a.x + b.x + c.x,
            y: a.y + b.y + c.y,
            z: a.z + b.z + c.z
        };
    };

    // Subtract one vector from another, by subtracting each component
    static subtract(a: Vector, b: Vector): Vector {
        return {
            x: a.x - b.x,
            y: a.y - b.y,
            z: a.z - b.z
        };
    };

    // Length, or magnitude, measured by [Euclidean norm](https://en.wikipedia.org/wiki/Euclidean_vector#Length)
    static len(a: Vector) {
        return Math.sqrt(Vector.dotProduct(a, a));
    };

    // Given a vector `a`, which is a point in space, and a `normal`, which is
    // the angle the point hits a surface, returna  new vector that is reflect
    // off of that surface
    static reflectThrough = function (a: Vector, normal: Vector) {
        var d = Vector.scale(normal, Vector.dotProduct(a, normal));
        return Vector.subtract(Vector.scale(d, 2), a);
    };

    private constructor(public x: number, public y: number, public z: number) {
    }
}