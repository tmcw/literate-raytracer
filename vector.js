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
var Vector = {};

// # Constants
Vector.UP = { x: 0, y: 1, z: 0 };
Vector.ZERO = { x: 0, y: 0, z: 0 };
Vector.WHITE = { x: 255, y: 255, z: 255 };
Vector.ZEROcp = function() {
    return { x: 0, y: 0, z: 0 };
};

// # Operations
//
// ## [Dot Product](https://en.wikipedia.org/wiki/Dot_product)
// is different than the rest of these since it takes two vectors but
// returns a single number value.
Vector.dotProduct = function(a, b) {
    return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
};

// ## [Cross Product](https://en.wikipedia.org/wiki/Cross_product)
//
// generates a new vector that's perpendicular to both of the vectors
// given.
Vector.crossProduct = function(a, b) {
    return {
        x: (a.y * b.z) - (a.z * b.y),
        y: (a.z * b.x) - (a.x * b.z),
        z: (a.x * b.y) - (a.y * b.x)
    };
};

// Enlongate or shrink a vector by a factor of `t`
Vector.scale = function(a, t) {
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
Vector.unitVector = function(a) {
    return Vector.scale(a, 1 / Vector.length(a));
};

// Add two vectors to each other, by simply combining each
// of their components
Vector.add = function(a, b) {
    return {
        x: a.x + b.x,
        y: a.y + b.y,
        z: a.z + b.z
    };
};

// A version of `add` that adds three vectors at the same time. While
// it's possible to write a clever version of `Vector.add` that takes
// any number of arguments, it's not fast, so we're keeping it simple and
// just making two versions.
Vector.add3 = function(a, b, c) {
    return {
        x: a.x + b.x + c.x,
        y: a.y + b.y + c.y,
        z: a.z + b.z + c.z
    };
};

// Subtract one vector from another, by subtracting each component
Vector.subtract = function(a, b) {
    return {
        x: a.x - b.x,
        y: a.y - b.y,
        z: a.z - b.z
    };
};

// Length, or magnitude, measured by [Euclidean norm](https://en.wikipedia.org/wiki/Euclidean_vector#Length)
Vector.length = function(a) {
    return Math.sqrt(Vector.dotProduct(a, a));
};

// Given a vector `a`, which is a point in space, and a `normal`, which is
// the angle the point hits a surface, returna  new vector that is reflect
// off of that surface
Vector.reflectThrough = function(a, normal) {
    var d = Vector.scale(normal, Vector.dotProduct(a, normal));
    return Vector.subtract(Vector.scale(d, 2), a);
};
