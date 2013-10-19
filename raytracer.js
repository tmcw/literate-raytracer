// # Setup
var c = document.getElementById('c'),
    width = 640,
    height = 480;

c.width = width;
c.height = height;

var intersection = {
    sphere: sphereIntersection
};

// Get a context in order to generate a proper data array. We aren't going to
// use traditional Canvas drawing functions like `fillRect` - instead this
// raytracer will directly compute pixel data and then put it into an image.
var ctx = c.getContext('2d'),
    data = ctx.getImageData(0, 0, width, height);

var lights = [{ x: -30, y: -30, z: 20 }];

var objects = [{
    type: 'sphere',
    point: {
        x: 1,
        y: 3,
        z: -10
    },
    radius: 2
}];

var camera = {
    point: {
        x: 0,
        y: 1.8,
        z: 10
    },
    fieldOfView: 45,
    vector: {
        x: 0,
        y: 3,
        z: 0
    }
};

// # Throwing Rays
//
// For each pixel in the canvas, there needs to be at least one ray of light
// that determines its color by bouncing through the scene.
var eyeVector = Vector.unitVector(Vector.subtract(camera.vector, camera.point)),
    fovRadians = Math.PI * (camera.fieldOfView / 2) / 180,
    halfWidth = Math.tan(fovRadians),
    halfHeight = (height/width) * halfWidth,
    camerawidth = halfWidth * 2,
    cameraheight = halfHeight * 2,
    pixelWidth = camerawidth / (width - 1),
    pixelHeight = cameraheight / (height - 1),
    vpRight = Vector.unitVector(Vector.crossProduct(eyeVector, Vector.UP)),
    vpUp = Vector.unitVector(Vector.crossProduct(vpRight, eyeVector));

var index, ray, color;
for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {

        var xcomp = Vector.scale(vpRight, (x * pixelWidth) - halfWidth),
            ycomp = Vector.scale(vpUp, (y * pixelHeight) - halfHeight);

        ray = {
            point: camera.point,
            vector: Vector.unitVector(Vector.add(eyeVector, xcomp, ycomp))
        };

        color = trace(ray, 1, 1);
        index = (x * 4) + (y * width * 4),
        data.data[index + 0] = color.x;
        data.data[index + 1] = color.y;
        data.data[index + 2] = color.z;
        data.data[index + 3] = 255;
    }
}

// Now that each ray has returned and populated the `data` array with
// correctly lit colors, fill the canvas with the generated data.
ctx.putImageData(data, 0, 0);

// ## Sphere
//
// Spheres are one of the simplest objects for rays to interact with, since
// the geometrical math for finding intersections and reflections with them
// is pretty straightforward.
function sphereIntersection(sphere, ray) {

    var eye_to_center = Vector.subtract(sphere.point, ray.point),
        // the length of a
        // hypoteneuse of a right triangle with points
        // at the eye and the center of the circle, and a right
        // angle at the other point.
        v = Vector.dotProduct(eye_to_center, ray.vector),
        eoDot = Vector.dotProduct(eye_to_center, eye_to_center),
        discriminant = (sphere.radius * sphere.radius) - eoDot + (v * v);

    if (discriminant < 0) {
        return;
    } else {
        return v - Math.sqrt(discriminant);
    }
}

function sphereNormal(sphere, pos) {
    return Vector.unitVector(
        Vector.subtract(pos, sphere.point));
}

function trace(ray, depth, current_reflectance) {
    if (depth > 10) return;

    ray.hit = null;

    var dist = intersection[objects[0].type](objects[0], ray);
    var pointAtTime = Vector.add(ray.point, Vector.scale(ray.vector, dist));

    if (dist) {
        return surface(ray, pointAtTime, sphereNormal(objects[0], pointAtTime));
    } else {
        return Vector.WHITE;
    }
}

function surface(ray, pointAtTime, normal) {
    var b = { x: 20, y: 50, z: 255 },
        c = Vector.ZEROcp();
    var lambertCoefficient = 0.9;

    var lambertAmount = 0;
    lights.forEach(function(lightPoint) {
        var contribution = Vector.dotProduct(Vector.unitVector(
            Vector.subtract(lightPoint, pointAtTime)), normal);
        if (contribution > 0) lambertAmount += contribution;
    });

    lambertAmount = Math.min(1, lambertAmount);
    c = Vector.add(c, Vector.scale(b, lambertCoefficient * lambertAmount));

    // ambient coefficient
    c = Vector.add(c, Vector.scale(b, 0.5));
    return c;
}
