var c = document.getElementById('c'),
    width = 100,
    height = 100;

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

var light = { x: 30, y: 30, z: 10 };

var objects = [
    {
        type: 'sphere',
        vector: {
            x: 0,
            y: 0,
            z: 0
        },
        radius: 9
    }
];

var camera = {
    point: {
        x: 8,
        y: 3,
        z: 3
    },
    forward: unitVector({
        x: 1,
        y: 1,
        z: 1
    }),
    lookAt: {
        x: 0,
        y: 0,
        z: 0
    }
};

camera.right = unitVector(crossProduct(camera.point, { x: 0, y: -1, z: 0 }));
camera.up = unitVector(crossProduct(camera.point, camera.right));

// # Throwing Rays
//
// For each pixel in the canvas, there needs to be at least one ray of light
// that determines its color by bouncing through the scene.
var index, ray, color;
for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {

        index = (x * 4) + (y * width * 4),
        ray = {
            vector: unitVector(add(camera.forward,
                add(scale(camera.right, (x - width / 2) / 4),
                    scale(camera.up, (y - height/2) / 4))))
        };

        color = trace(ray, 1, 1);
        data.data[index + 0] = color[0];
        data.data[index + 1] = color[1];
        data.data[index + 2] = color[2];
        data.data[index + 3] = color[3];
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

    var eye_to_center = subtract(camera.point, sphere.vector),
        // the length of a
        // hypoteneuse of a right triangle with points
        // at the eye and the center of the circle, and a right
        // angle at the other point.
        v = dotProduct(ray.vector, eye_to_center),
        eoDot = dotProduct(eye_to_center, eye_to_center),
        // the radius of the sphere, squared.
        r2 = sphere.radius * sphere.radius,
        discriminant =  r2 - eoDot + (v * v);

    var sqrt = Math.sqrt(discriminant);
    if (discriminant) return -v - sqrt;
    else if (discriminant) return -v + sqrt;
    else return;
}

function sphereNormal(sphere, pos) {
    return scale(this.vectorSub(pos, sphere.point), 1 / sphere.radius);
}

function trace(ray, depth, current_reflectance) {
    if (depth > 10) return;

    ray.hit = null;

    var dist = intersection[objects[0].type](objects[0], ray);

    if (dist) {
        var pos = add(camera.point, scale(ray.vector, dist));
    }

    if (dist) {
        return [10, 10, 10, 255];
    } else {
        return [255, 255, 255, 255];
    }
}
