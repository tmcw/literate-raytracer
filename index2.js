"use strict";
const g_canvas = document.getElementById('c');
resize(g_canvas);
// const g_gl: WebGLRenderingContext = (window as any).WebGLDebugUtils.makeDebugContext(
// canvas.getContext('webgl')
// );
const g_gl = g_canvas.getContext('webgl');
if (!g_gl) {
    throw new Error('fail to launch gl');
}
const vertexSource = `
    attribute vec4 a_position;
     
    void main() {
       gl_Position = a_position;
    }
`;
const triangleCount = 1;
const lightCount = 1;
const sphereCount = 3;
const epsilon = 0.00005;
const bg = {
    r: '1.0',
    g: '1.0',
    b: '1.0',
};
const fragmentSource = `precision mediump float;

    struct Ray {
        vec3 point;
        vec3 vector;
    };

    struct Sphere {
        vec3 colour;
        vec3 point;
        float radius;
        float ambient;
        float lambert;
        float specular;
    };

    struct SphereDistance {
        float distance;
        Sphere sphere;
    };

    struct Triangle {
        vec3 a;
        vec3 b;
        vec3 c;
        vec3 normal;
    };

    struct TriangleDistance {
        float distance;
        Triangle triangle;
    };

    struct PointLight {
        vec3 point;
    };
    const vec4 bgColour = vec4(${bg.r}, ${bg.g}, ${bg.b}, 1.0);

    uniform vec3 cameraPos;
    uniform vec3 vpRight;
    uniform float pixelWidth;
    uniform float halfWidth;
    uniform vec3 vpUp;
    uniform float pixelHeight;
    uniform float halfHeight;
    uniform vec3 eyeVector;
     
    uniform Sphere spheres[${sphereCount}];
    uniform PointLight pointLights[${lightCount}];
    uniform Triangle triangles[${triangleCount}];

    float sphereIntersection(Sphere sphere, Ray ray);
    bool triangleIntersection(Triangle triangle, Ray ray);
    SphereDistance intersectSpheres(Ray ray);
    TriangleDistance intersectTriangles(Ray ray);
    vec4 trace(Ray ray);
    vec4 trace2(Ray ray);
    vec4 trace3(Ray ray);
    vec3 sphereNormal(Sphere sphere, vec3 pos);
    vec4 surface(Ray ray, Sphere sphere, vec3 pointAtTime, vec3 normal);
    vec4 surface2(Ray ray, Sphere sphere, vec3 pointAtTime, vec3 normal);
    vec4 surface3(Ray ray, Sphere sphere, vec3 pointAtTime, vec3 normal);
    bool isLightVisible(vec3 pt, PointLight light, vec3 normal);
    void draw();
     
    void main() {
        draw();
    }

    void draw() {
        float x = gl_FragCoord.x;
        float y = gl_FragCoord.y;
        float scaleX = (x * pixelWidth) - halfWidth;
        float scaleY = (y * pixelHeight) - halfHeight;

        vec3 xcomp = vec3(vpRight.xyz * scaleX);
        vec3 ycomp = vec3(vpUp.xyz * scaleY);
        vec3 xPlusY = xcomp + ycomp;
        vec3 full = eyeVector + xPlusY;

        Ray ray = Ray(cameraPos, normalize(full));

        gl_FragColor = trace(ray);
    }

    vec4 trace(Ray ray) {
       SphereDistance sd = intersectSpheres(ray);
       TriangleDistance td = intersectTriangles(ray);
       if (sd.distance <= 0.0 && td.distance <= 0.0) {
           return bgColour;
       }

       if (sd.distance >= 0.0) {
        vec3 pointAtTime = ray.point + vec3(ray.vector.xyz * sd.distance);
        vec3 normal = sphereNormal(sd.sphere, pointAtTime);

        return surface(ray, sd.sphere, pointAtTime, normal);
       }

       return vec4(0.0, 0.0, 0.8, 1.0);
    }

    vec4 trace2(Ray ray) {
       SphereDistance sd = intersectSpheres(ray);
       if (sd.distance <= 0.0) {
           return bgColour;
       }

       vec3 pointAtTime = ray.point + vec3(ray.vector.xyz * sd.distance);
       vec3 normal = sphereNormal(sd.sphere, pointAtTime);

       return surface2(ray, sd.sphere, pointAtTime, normal);
    }

    vec4 trace3(Ray ray) {
       SphereDistance sd = intersectSpheres(ray);
       if (sd.distance <= 0.0) {
           return bgColour;
       }

       vec3 pointAtTime = ray.point + vec3(ray.vector.xyz * sd.distance);
       vec3 normal = sphereNormal(sd.sphere, pointAtTime);

       return surface3(ray, sd.sphere, pointAtTime, normal);
    }

    vec3 sphereNormal(Sphere sphere, vec3 pos) {
        return normalize(pos - sphere.point);
    }

    SphereDistance intersectSpheres(Ray ray) {
        SphereDistance sd = SphereDistance(-1.0, Sphere(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.0), -1.0, 0.0, 0.0, 0.0));
        for (int i = 0; i < ${sphereCount}; i += 1) {
            Sphere s = spheres[i];
            float dist = sphereIntersection(s, ray);
            if (dist >= 0.0) {
                if (sd.distance <= 0.0 || dist < sd.distance) {
                    sd.distance = dist;
                    sd.sphere = s;
                }
            }
        }
        return sd;
    }

    TriangleDistance intersectTriangles(Ray ray) {
        TriangleDistance td = TriangleDistance(-1.0, Triangle(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.0)));
        for (int i = 0; i < ${triangleCount}; i += 1) {
            Triangle t = triangles[i];
            bool didIntersect = triangleIntersection(t, ray);
            if (didIntersect == true) {
                td.distance = 1.0;
                td.triangle = t;
            }
        }
        return td;
    }

    bool triangleIntersection(Triangle triangle, Ray ray) {
        // Step 1: finding P
    
        // check if ray and plane are parallel ?
        float normalDotRay = dot(triangle.normal, ray.vector);
        if (abs(normalDotRay) < ${epsilon}) {
            // parallel lines
            return false;
        }

        // compute d parameter using equation 2
        float d = dot(triangle.normal, triangle.a);
    
        // compute t (equation 3)
        float t = (dot(triangle.normal, ray.point) + d) / normalDotRay;

        // check if the triangle is in behind the ray
        if (t > 0.0) {
            // the triangle is behind
            return false;
        }
 
        // compute the intersection point using equation 1
        vec3 P = ray.point + t * ray.vector;


        // Step 2: inside-outside test
        vec3 C;  // vector perpendicular to triangle's plane
 
        // edge 0
        vec3 edge0 = triangle.b - triangle.a;
        vec3 vp0 = P - triangle.a;
        C = cross(edge0, vp0);

        if (dot(triangle.normal, C) < 0.0) {
            // P is on the right side;
            return false;
        }
 
        // edge 1
        vec3 edge1 = triangle.c - triangle.b;
        vec3 vp1 = P - triangle.b;
        C = cross(edge1, vp1);

        if (dot(triangle.normal, C) < 0.0) {
            // P is on the right side
            return false;
        }
 
        // edge 2
        vec3 edge2 = triangle.a - triangle.c;
        vec3 vp2 = P - triangle.c;
        C = cross(edge2, vp2);

        if (dot(triangle.normal, C) < 0.0) {
            // P is on the right side;
            return false;
        }

        return true; // this ray hits the triangle
    }

    float sphereIntersection(Sphere sphere, Ray ray) {
        vec3 eyeToCentre = sphere.point - ray.point;
        float v = dot(eyeToCentre, ray.vector);
        float eoDot = dot(eyeToCentre, eyeToCentre);
        float discriminant = (sphere.radius * sphere.radius) - eoDot + (v * v);

        if (discriminant < 0.0) {
            return -1.0;
        }

        return v - sqrt(discriminant);
    }

    bool isLightVisible(vec3 pt, PointLight light, vec3 normal) {
        vec3 unit = normalize(pt  - light.point);
        SphereDistance sd = intersectSpheres(Ray(pt + vec3(normal.xyz * ${epsilon}), unit));

        return sd.distance > 0.0;
    }

    vec4 surface(Ray ray, Sphere sphere, vec3 pointAtTime, vec3 normal) {
        vec3 b = vec3(sphere.colour.rgb / 255.0);
        vec3 c = vec3(0.0, 0.0, 0.0);
        float lambertAmount = 0.0;

        if (sphere.lambert > 0.0) {
            for (int i = 0; i < ${lightCount}; i += 1) {
                if (isLightVisible(pointAtTime, pointLights[i], normal) == true) {
                    vec3 lmp = normalize(pointLights[i].point - pointAtTime);
                    float contribution = dot(lmp, normal);

                    if (contribution > 0.0) {
                        lambertAmount += contribution;
                    }
                }
            }
        }

        if (sphere.specular > 0.0) {
            vec3 reflected = reflect(ray.vector, normal);
            vec4 rColour = trace2(Ray(pointAtTime, reflected));
            if (rColour.r > 0.0 && rColour.g > 0.0 && rColour.b > 0.0 && rColour.a > 0.0) {
                c += vec3(rColour.rgb * sphere.specular);
            }
        }

        lambertAmount = min(1.0, lambertAmount);

        vec3 lambert = vec3(b.rgb * lambertAmount * sphere.lambert);
        vec3 ambient = vec3(b.rgb * sphere.ambient);

        vec3 total = lambert + ambient + c;
        return vec4(total.rgb, 1.0);
    }

    vec4 surface2(Ray ray, Sphere sphere, vec3 pointAtTime, vec3 normal) {
        vec3 b = sphere.colour;
        vec3 c = vec3(0.0, 0.0, 0.0);
        float lambertAmount = 0.0;

        if (sphere.lambert > 0.0) {
            for (int i = 0; i < ${lightCount}; i += 1) {
                if (isLightVisible(pointAtTime, pointLights[i], normal) == true) {
                    vec3 lmp = normalize(pointLights[i].point - pointAtTime);
                    float contribution = dot(lmp, normal);

                    if (contribution > 0.0) {
                        lambertAmount += contribution;
                    }
                }
            }
        }

        if (sphere.specular > 0.0) {
            vec3 reflected = reflect(ray.vector, normal);
            vec4 rColour = trace3(Ray(pointAtTime, reflected));
            if (rColour.r > 0.0 && rColour.g > 0.0 && rColour.b > 0.0 && rColour.a > 0.0) {
                c += vec3(rColour.rgb * sphere.specular);
            }
        }

        lambertAmount = min(1.0, lambertAmount);

        vec3 lambert = vec3(b.rgb / 255.0 * lambertAmount * sphere.lambert);
        vec3 ambient = vec3(b.rgb / 255.0 * sphere.ambient);

        vec3 total = lambert + ambient + c;
        return vec4(total.r, total.g, total.b, 1.0);
    }

    vec4 surface3(Ray ray, Sphere sphere, vec3 pointAtTime, vec3 normal) {
        vec3 b = sphere.colour;
        vec3 c = vec3(0.0, 0.0, 0.0);
        float lambertAmount = 0.0;

        if (sphere.lambert > 0.0) {
            for (int i = 0; i < ${lightCount}; i += 1) {
                if (isLightVisible(pointAtTime, pointLights[i], normal) == true) {
                    vec3 lmp = normalize(pointLights[i].point - pointAtTime);
                    float contribution = dot(lmp, normal);

                    if (contribution > 0.0) {
                        lambertAmount += contribution;
                    }
                }
            }
        }

        lambertAmount = min(1.0, lambertAmount);

        vec3 lambert = vec3(b.rgb / 255.0 * lambertAmount * sphere.lambert);
        vec3 ambient = vec3(b.rgb / 255.0 * sphere.ambient);

        vec3 total = lambert + ambient + c;
        return vec4(total.r, total.g, total.b, 1.0);
    }
`;
function bindProgram(gl) {
    const vs = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = createProgram(gl, vs, fs);
    // look up where the vertex data needs to go.
    const positionLocation = gl.getAttribLocation(program, "a_position");
    // Create a buffer.
    const positionBuffer = gl.createBuffer();
    if (!positionBuffer) {
        throw new Error('fail to get position buffer');
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Put a unit quad in the buffer
    const positions = [
        -1, -1,
        -1, 1,
        1, -1,
        1, -1,
        -1, 1,
        1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    // Tell WebGL to use our shader program pair
    gl.useProgram(program);
    return {
        positionBuffer,
        positionLocation,
        program,
    };
}
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    if (!program) {
        throw new Error('could not create GL program');
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error('could not compile GL: ' + log);
}
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error('could not create shader: ' + source);
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error('shader error: ' + log + '\n\n' + source);
}
// Unlike images, textures do not have a width and height associated
// with them so we'll pass in the width and height of the texture
function draw(gl, context) {
    if (resize(g_canvas)) {
        setupScene(gl, context, g_scene);
    }
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enableVertexAttribArray(context.positionLocation);
    gl.vertexAttribPointer(context.positionLocation, 2, gl.FLOAT, false, 0, 0);
    // draw the quad (2 triangles, 6 vertices)
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}
/**
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */
const g_scene = {
    camera: {
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
    },
    lights: [{
            x: -30,
            y: -10,
            z: 20
        }],
    spheres: [
        {
            type: 'sphere',
            point: {
                x: 0,
                y: 3.5,
                z: -3
            },
            colour: {
                x: 100,
                y: 0,
                z: 0
            },
            specular: 0.2,
            lambert: 0.7,
            ambient: 0.1,
            radius: 3
        },
        {
            type: 'sphere',
            point: {
                x: -4,
                y: 2,
                z: -1
            },
            colour: {
                x: 0,
                y: 0,
                z: 124,
            },
            specular: 0.1,
            lambert: 0.9,
            ambient: 0.0,
            radius: 0.2
        },
        {
            type: 'sphere',
            point: {
                x: -4,
                y: 3,
                z: -1
            },
            colour: {
                x: 0,
                y: 255,
                z: 0
            },
            specular: 0.2,
            lambert: 0.7,
            ambient: 0.1,
            radius: 0.1
        },
    ],
    triangles: [
        {
            type: 'triangle',
            points: [
                {
                    x: 3,
                    y: 2,
                    z: -1,
                },
                {
                    x: -3,
                    y: 2,
                    z: -1,
                },
                {
                    x: -3,
                    y: -1,
                    z: -1,
                },
            ],
            colour: {
                x: 0,
                y: 255,
                z: 0
            },
            specular: 0.2,
            lambert: 0.7,
            ambient: 0.1,
            radius: 0.1
        },
    ],
};
const g_ctx = bindProgram(g_gl);
const uniforms = setupScene(g_gl, g_ctx, g_scene);
draw(g_gl, g_ctx);
let planet1 = 0;
let planet2 = 0;
let zod1 = 0.05;
const animate = () => {
    planet1 += 0.01;
    planet2 += 0.02;
    // move zod around
    if (g_scene.triangles[0].points[0].y > 5.5) {
        zod1 *= -1;
    }
    else if (g_scene.triangles[0].points[0].y < -5.5) {
        zod1 *= -1;
    }
    g_scene.triangles[0].points[0].y += zod1;
    // set the position of each moon with some trig.
    g_scene.spheres[1].point.x = Math.sin(planet1) * 3.5;
    g_scene.spheres[1].point.z = -3 + (Math.cos(planet1) * 3.5);
    g_scene.spheres[2].point.x = Math.sin(planet2) * 4;
    g_scene.spheres[2].point.z = -3 + (Math.cos(planet2) * 4);
    g_scene.spheres.forEach((o, i) => {
        uniforms.spheres(i, o.radius, o.point, o.colour, o.ambient, o.lambert, o.specular);
    });
    g_scene.triangles.forEach((t, i) => {
        const v0v1 = Vector.subtract(t.points[1], t.points[0]);
        const v0v2 = Vector.subtract(t.points[2], t.points[0]);
        const normal = Vector.unitVector(Vector.crossProduct(v0v1, v0v2));
        uniforms.triangles(i, t.points[0], t.points[1], t.points[2], normal);
    });
    draw(g_gl, g_ctx);
    requestAnimationFrame(animate);
};
animate();
function setupScene(gl, context, scene) {
    const { camera, spheres, triangles, lights } = scene;
    const u = getUniformSetters(gl, context.program);
    // This process
    // is a bit odd, because there's a disconnect between pixels and vectors:
    // given the left and right, top and bottom rays, the rays we shoot are just
    // interpolated between them in little increments.
    //
    // Starting with the height and width of the scene, the camera's place,
    // direction, and field of view, we calculate factors that create
    // `width*height` vectors for each ray
    // Start by creating a simple vector pointing in the direction the camera is
    // pointing - a unit vector
    const eyeVector = Vector.unitVector(Vector.subtract(camera.vector, camera.point));
    u.eyeVector(eyeVector);
    // and then we'll rotate this by combining it with a version that's turned
    // 90° right and one that's turned 90° up. Since the [cross product](http://en.wikipedia.org/wiki/Cross_product)
    // takes two vectors and creates a third that's perpendicular to both,
    // we use a pure 'UP' vector to turn the camera right, and that 'right'
    // vector to turn the camera up.
    const vpRight = Vector.unitVector(Vector.crossProduct(eyeVector, Vector.UP));
    u.vpRight(vpRight);
    const vpUp = Vector.unitVector(Vector.crossProduct(vpRight, eyeVector));
    u.vpUp(vpUp);
    const width = gl.canvas.clientWidth;
    const height = gl.canvas.clientHeight;
    // The actual ending pixel dimensions of the image aren't important here -
    // note that `width` and `height` are in pixels, but the numbers we compute
    // here are just based on the ratio between them, `height/width`, and the
    // `fieldOfView` of the camera.
    const fovRadians = Math.PI * camera.fieldOfView / 180;
    const heightWidthRatio = height / width;
    const halfWidth = Math.tan(fovRadians);
    u.halfWidth(halfWidth);
    const halfHeight = heightWidthRatio * halfWidth;
    u.halfHeight(halfHeight);
    const camerawidth = halfWidth * 2;
    const cameraheight = halfHeight * 2;
    const pixelWidth = camerawidth / (width - 1);
    u.pixelWidth(pixelWidth);
    const pixelHeight = cameraheight / (height - 1);
    u.pixelHeight(pixelHeight);
    u.cameraPos(camera.point);
    spheres.forEach((s, i) => {
        u.spheres(i, s.radius, s.point, s.colour, s.ambient, s.lambert, s.specular);
    });
    triangles.forEach((t, i) => {
        const v0v1 = Vector.subtract(t.points[1], t.points[0]);
        const v0v2 = Vector.subtract(t.points[2], t.points[0]);
        const normal = Vector.unitVector(Vector.crossProduct(v0v1, v0v2));
        u.triangles(i, t.points[0], t.points[1], t.points[2], normal);
    });
    lights.forEach((l, i) => {
        u.lights(i, l);
    });
    return u;
}
function getUniformLocation(gl, program, name) {
    const location = gl.getUniformLocation(program, name);
    if (!location) {
        throw new Error('could not get uniform location ' + name);
    }
    return location;
}
function getUniformSetters(gl, program) {
    const cameraPos = getUniformLocation(gl, program, 'cameraPos');
    const vpRight = getUniformLocation(gl, program, 'vpRight');
    const pixelWidth = getUniformLocation(gl, program, 'pixelWidth');
    const halfWidth = getUniformLocation(gl, program, 'halfWidth');
    const vpUp = getUniformLocation(gl, program, 'vpUp');
    const pixelHeight = getUniformLocation(gl, program, 'pixelHeight');
    const halfHeight = getUniformLocation(gl, program, 'halfHeight');
    const eyeVector = getUniformLocation(gl, program, 'eyeVector');
    const spheres = g_scene.spheres.map((_, i) => {
        return {
            colour: getUniformLocation(gl, program, `spheres[${i}].colour`),
            point: getUniformLocation(gl, program, `spheres[${i}].point`),
            radius: getUniformLocation(gl, program, `spheres[${i}].radius`),
            ambient: getUniformLocation(gl, program, `spheres[${i}].ambient`),
            lambert: getUniformLocation(gl, program, `spheres[${i}].lambert`),
            specular: getUniformLocation(gl, program, `spheres[${i}].specular`),
        };
    });
    const triangles = g_scene.triangles.map((_, i) => {
        return {
            a: getUniformLocation(gl, program, `triangles[${i}].a`),
            b: getUniformLocation(gl, program, `triangles[${i}].b`),
            c: getUniformLocation(gl, program, `triangles[${i}].c`),
            normal: getUniformLocation(gl, program, `triangles[${i}].normal`),
        };
    });
    const lights = g_scene.lights.map((_, i) => {
        return {
            point: getUniformLocation(gl, program, `pointLights[${i}].point`),
        };
    });
    const setVec3 = (loc, v) => {
        gl.uniform3f(loc, v.x, v.y, v.z);
    };
    const setFloat = (loc, f) => {
        gl.uniform1f(loc, f);
    };
    return {
        cameraPos(pos) {
            setVec3(cameraPos, pos);
        },
        vpRight(vec) {
            setVec3(vpRight, vec);
        },
        pixelWidth(width) {
            setFloat(pixelWidth, width);
        },
        halfWidth(width) {
            setFloat(halfWidth, width);
        },
        vpUp(vec) {
            setVec3(vpUp, vec);
        },
        pixelHeight(height) {
            setFloat(pixelHeight, height);
        },
        halfHeight(height) {
            setFloat(halfHeight, height);
        },
        eyeVector(vec) {
            setVec3(eyeVector, vec);
        },
        spheres(index, radius, point, colour, ambient, lambert, specular) {
            if (!spheres[index]) {
                throw new RangeError('out of bounds sphere');
            }
            setVec3(spheres[index].point, point);
            setFloat(spheres[index].radius, radius);
            setVec3(spheres[index].colour, colour);
            setFloat(spheres[index].ambient, ambient);
            setFloat(spheres[index].lambert, lambert);
            setFloat(spheres[index].specular, specular);
        },
        triangles(index, a, b, c, normal) {
            if (!triangles[index]) {
                throw new RangeError('out of bounds triangle');
            }
            setVec3(triangles[index].a, a);
            setVec3(triangles[index].b, b);
            setVec3(triangles[index].c, c);
            setVec3(triangles[index].normal, normal);
        },
        lights(index, point) {
            if (!lights[index]) {
                throw new RangeError('out of bounds light');
            }
            setVec3(lights[index].point, point);
        }
    };
}
function resize(canvas) {
    // Lookup the size the browser is displaying the canvas.
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    // Check if the canvas is not the same size.
    if (canvas.width != displayWidth || canvas.height != displayHeight) {
        // Make the canvas the same size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        return true;
    }
    return false;
}
