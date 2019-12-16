const canvas = document.getElementById('c') as HTMLCanvasElement;
const g_width = 640;
const g_height = 480;

canvas.width = g_width;
canvas.height = g_height;
canvas.style.cssText = 'width:' + (g_width) + 'px;height:' + (g_height) + 'px';

interface ProgramContext {
    positionBuffer: WebGLBuffer;
    positionLocation: number;
    program: WebGLProgram;
}

// const g_gl: WebGLRenderingContext = (window as any).WebGLDebugUtils.makeDebugContext(
// canvas.getContext('webgl')
// );
const g_gl = canvas.getContext('webgl');

if (!g_gl) {
    throw new Error('fail to launch gl');
}

const vertexSource = `
    attribute vec4 a_position;
     
    void main() {
       gl_Position = a_position;
    }
`;

const fragmentSource = `precision mediump float;

    struct Ray {
        vec3 point;
        vec3 vector;
    };

    struct Sphere {
        vec3 colour;
        vec3 point;
        float radius;
    };

    struct SphereDistance {
        float distance;
        Sphere sphere;
    };

    uniform vec3 cameraPos;
    uniform vec3 vpRight;
    uniform float pixelWidth;
    uniform float halfWidth;
    uniform vec3 vpUp;
    uniform float pixelHeight;
    uniform float halfHeight;
    uniform vec3 eyeVector;
     
    uniform Sphere spheres[3];

    float sphereIntersection(Sphere sphere, Ray ray);
    SphereDistance intersectScene(Ray ray);
    vec4 trace(Ray ray, int depth);
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

        gl_FragColor = trace(ray, 0);
    }

    vec4 trace(Ray ray, int depth) {
       if (depth > 3) {
           return vec4(0.0, 0.0, 0.0, 1.0);
       } 

       SphereDistance sd = intersectScene(ray);
       if (sd.distance <= 0.0) {
           return vec4(1.0, 1.0, 1.0, 1.0);
       }

       return vec4(sd.sphere.colour.r / 255.0, sd.sphere.colour.g / 255.0, sd.sphere.colour.b / 255.0, 1.0);
    }

    SphereDistance intersectScene(Ray ray) {
        SphereDistance sd = SphereDistance(-1.0, Sphere(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.0), -1.0));
        for (int i = 0; i < 3; i += 1) {
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
`;

function bindProgram(gl: WebGLRenderingContext): ProgramContext {
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


function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
) {
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

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
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
function draw(gl: WebGLRenderingContext, context: ProgramContext) {
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
    objects: [
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
        }
    ],
};

type Scene = typeof g_scene;


const g_ctx = bindProgram(g_gl);
const uniforms = setupScene(g_gl, g_ctx, g_scene);
draw(g_gl, g_ctx);

let planet1 = 0;
let planet2 = 0;

const animate = () => {
    planet1 += 0.01;
    planet2 += 0.02;

    // set the position of each moon with some trig.
    g_scene.objects[1].point.x = Math.sin(planet1) * 3.5;
    g_scene.objects[1].point.z = -3 + (Math.cos(planet1) * 3.5);

    g_scene.objects[2].point.x = Math.sin(planet2) * 4;
    g_scene.objects[2].point.z = -3 + (Math.cos(planet2) * 4);

    g_scene.objects.forEach((o, i) => {
        uniforms.spheres(i, o.radius, o.point, o.colour);
    });
    draw(g_gl, g_ctx);
    requestAnimationFrame(animate);
};
animate();


function setupScene(gl: WebGLRenderingContext, context: ProgramContext, scene: Scene) {
    const { camera, objects, lights } = scene;
    const u = getUniformSetters(gl, context.program, objects.length);

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

        // The actual ending pixel dimensions of the image aren't important here -
        // note that `width` and `height` are in pixels, but the numbers we compute
        // here are just based on the ratio between them, `height/width`, and the
        // `fieldOfView` of the camera.
    const fovRadians = Math.PI * camera.fieldOfView / 180;
    const heightWidthRatio = gl.canvas.height / gl.canvas.width;
    const halfWidth = Math.tan(fovRadians);
    u.halfWidth(halfWidth);
    const halfHeight = heightWidthRatio * halfWidth;
    u.halfHeight(halfHeight);
    const camerawidth = halfWidth * 2;
    const cameraheight = halfHeight * 2;
    const pixelWidth = camerawidth / (g_width - 1);
    u.pixelWidth(pixelWidth);
    const pixelHeight = cameraheight / (g_height - 1);
    u.pixelHeight(pixelHeight);

    u.cameraPos(camera.point);

    objects.forEach((o, i) => {
        u.spheres(i, o.radius, o.point, o.colour);
    });

    return u;
}

function getUniformLocation(gl: WebGLRenderingContext, program: WebGLProgram, name: string): WebGLUniformLocation {
    const location = gl.getUniformLocation(program, name);
    if (!location) {
        throw new Error('could not get uniform location ' + name);
    }
    return location;
}

function getUniformSetters(gl: WebGLRenderingContext, program: WebGLProgram, sphereCount: number) {

    const cameraPos = getUniformLocation(gl, program, 'cameraPos');
    const vpRight = getUniformLocation(gl, program, 'vpRight');
    const pixelWidth = getUniformLocation(gl, program, 'pixelWidth');
    const halfWidth = getUniformLocation(gl, program, 'halfWidth');
    const vpUp = getUniformLocation(gl, program, 'vpUp');
    const pixelHeight = getUniformLocation(gl, program, 'pixelHeight');
    const halfHeight = getUniformLocation(gl, program, 'halfHeight');
    const eyeVector = getUniformLocation(gl, program, 'eyeVector');

    const spheres = g_scene.objects.map((_, i) => {
        return {
            colour: getUniformLocation(gl, program, `spheres[${i}].colour`),
            point: getUniformLocation(gl, program, `spheres[${i}].point`),
            radius: getUniformLocation(gl, program, `spheres[${i}].radius`),
        };
    });

    const setVec3 = (loc: WebGLUniformLocation, v: Vector) => {
        gl.uniform3f(loc, v.x, v.y, v.z);
    };
    const setFloat = (loc: WebGLUniformLocation, f: number) => {
        gl.uniform1f(loc, f);
    };
     
    return {
        cameraPos(pos: Vector) {
            setVec3(cameraPos, pos);
        },
        vpRight(vec: Vector) {
            setVec3(vpRight, vec);
        },
        pixelWidth(width: number) {
            setFloat(pixelWidth, width);
        },
        halfWidth(width: number) {
            setFloat(halfWidth, width);
        },
        vpUp(vec: Vector) {
            setVec3(vpUp, vec);
        },
        pixelHeight(height: number) {
            setFloat(pixelHeight, height);
        },
        halfHeight(height: number) {
            setFloat(halfHeight, height);
        },
        eyeVector(vec: Vector) {
            setVec3(eyeVector, vec);
        },
        spheres(index: number, radius: number, point: Vector, colour: Vector) {
            if (!spheres[index]) {
                throw new RangeError('out of bounds sphere');
            }
            setVec3(spheres[index].point, point);
            setFloat(spheres[index].radius, radius);
            setVec3(spheres[index].colour, colour);
        },
    };
}