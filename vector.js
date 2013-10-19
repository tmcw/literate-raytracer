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

// ## [Dot product](https://en.wikipedia.org/wiki/Dot_product)
//
// This takes two vectors and returns a single number that is
// the result of multiplying each dimension of the vectors
// together and adding the results.
var Vector = {};


Vector.UP = {
    x: 0,
    y: 1,
    z: 0
};

Vector.ZERO = {
    x: 0,
    y: 0,
    z: 0
};

Vector.WHITE = {
    x: 255,
    y: 255,
    z: 255
};

Vector.ZEROcp = function() {
    return {
        x: 0,
        y: 0,
        z: 0
    };
};

Vector.dotProduct = function(a, b) {
    return (a.x * b.x) +
        (a.y * b.y) +
        (a.z * b.z);
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

// Add two vectors to each other, by simply combining each
// of their components
Vector.add = function() {
    var args = [].slice.call(arguments);
    return args.reduce(function(mem, vec) {
        return {
            x: mem.x + vec.x,
            y: mem.y + vec.y,
            z: mem.z + vec.z
        };
    }, Vector.ZERO);
};

// Subtract one vector from another, by subtracting each component
Vector.subtract = function(a, b) {
    return {
        x: a.x - b.x,
        y: a.y - b.y,
        z: a.z - b.z
    };
};

// Length, or magnitude
//
// As measured by [Euclidean norm](https://en.wikipedia.org/wiki/Euclidean_vector#Length)
Vector.length = function(a) {
    return Math.sqrt(Vector.dotProduct(a, a));
};

Vector.unitVector = function(a) {
    return Vector.scale(a, 1 / Vector.length(a));
};
