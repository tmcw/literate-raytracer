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
function dotProduct(a, b) {
    return (a.x * b.x) +
        (a.y * b.y) +
        (a.z * b.z);
}

// ## [Cross Product](https://en.wikipedia.org/wiki/Cross_product)
//
// generates a new vector that's perpendicular to both of the vectors
// given.
function crossProduct(a, b) {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    };
}

// Enlongate or shrink a vector by a factor of `t`
function scale(a, t) {
    return {
        x: a.x * t,
        y: a.y * t,
        z: a.z * t
    };
}

// Add two vectors to each other, by simply combining each
// of their components
function add(a, b) {
    return {
        x: a.x + b.x,
        y: a.y + b.y,
        z: a.z + b.z
    };
}

// Subtract one vector from another, by subtracting each component
function subtract(a, b) {
    return {
        x: a.x - b.x,
        y: a.y - b.y,
        z: a.z - b.z
    };
}

// Length, or magnitude
//
// As measured by [Euclidean norm](https://en.wikipedia.org/wiki/Euclidean_vector#Length)
function length(a) {
    return Math.sqrt(
        Math.pow(a.x, 2) +
        Math.pow(a.y, 2) +
        Math.pow(a.z, 2)
    );
}

function unitVector(a) {
    var len = length(a);
    if (!len) len = 1;

    return {
        x: a.x / len,
        y: a.y / len,
        z: a.z / len
    };
}
