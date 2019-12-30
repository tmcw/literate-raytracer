const g_canvas = document.getElementById('c') as HTMLCanvasElement;
resize(g_canvas);

interface ProgramContext {
    positionBuffer: WebGLBuffer;
    positionLocation: number;
    program: WebGLProgram;
}

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

const phongSpecularExp = '16.0';
const triangleCount = 3;
const lightCount = 1;
const sphereCount = 3;
const epsilon = 0.00005;
const bg = {
    r: '0.05',
    g: '0.05',
    b: '0.05',
};

const fragmentSource = `precision mediump float;

    struct Ray {
        vec3 point;
        vec3 vector;
    };

    struct Material {
        vec3 colour;
        float ambient;
        float lambert;
        float specular;
    };

    struct Hit {
        float distance;
        Material material;
        vec3 normal;
        vec3 position;
        Ray ray;
    };

    struct Sphere {
        vec3 point;
        float radius;
        Material material;
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
        Material material;
    };

    struct TriangleDistance {
        float distance;
        Triangle triangle;
        vec3 intersectPoint;
        float u;
        float v;
    };

    struct PointLight {
        vec3 point;
    };
    const vec4 bgColour = vec4(${bg.r}, ${bg.g}, ${bg.b}, 1.0);

    uniform float aspectRatio;
    uniform vec3 cameraPos;
    uniform mat4 cameraMatrix;
    uniform float globalAmbientIntensity;
    uniform float height;
    uniform float scale;
    uniform float width;
     
    uniform Sphere spheres[${sphereCount}];
    uniform PointLight pointLights[${lightCount}];
    uniform Triangle triangles[${triangleCount}];

    float sphereIntersection(Sphere sphere, Ray ray);
    TriangleDistance triangleIntersection(Triangle triangle, Ray ray);
    SphereDistance intersectSpheres(Ray ray);
    TriangleDistance intersectTriangles(Ray ray);
    vec4 cast1(Ray ray);
    vec4 cast2(Ray ray);
    vec4 cast3(Ray ray);
    vec3 sphereNormal(Sphere sphere, vec3 pos);
    vec4 surfacePhong(Hit hit);
    bool isLightVisible(vec3 pt, PointLight light, vec3 normal);
    void draw();
     
    void main() {
        draw();
    }

    void draw() {
        float px = gl_FragCoord.x;
        float py = gl_FragCoord.y;

        float x = (2.0 * (px + 0.5) / width - 1.0) * scale;
        float y = (2.0 * (py + 0.5) / height - 1.0) * scale * 1.0 / aspectRatio;

        vec3 dir = vec3(0.0, 0.0, 0.0);

        dir.x = x    * cameraMatrix[0][0] + y * cameraMatrix[1][0] + -1.0 * cameraMatrix[2][0];
        dir.y = y    * cameraMatrix[0][1] + y * cameraMatrix[1][1] + -1.0 * cameraMatrix[2][1];
        dir.z = -1.0 * cameraMatrix[0][2] + y * cameraMatrix[1][2] + -1.0 * cameraMatrix[2][2];

        Ray ray = Ray(cameraPos, normalize(dir));

        gl_FragColor = cast1(ray);
    }

    Hit trace(Ray ray) {
       SphereDistance sd = intersectSpheres(ray);
       TriangleDistance td = intersectTriangles(ray);
       if (sd.distance <= 0.0 && td.distance <= 0.0) {
           return Hit(
               -1.0,
               Material(vec3(0.0, 0.0, 0.0), 0.0, 0.0, 0.0),
               vec3(0.0, 0.0, 0.0),
               vec3(0.0, 0.0, 0.0),
               Ray(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.0))
           );
       }

       if (sd.distance >= 0.0 && td.distance >= 0.0) {
           if (sd.distance < td.distance) {
            vec3 pointAtTime = ray.point + vec3(ray.vector.xyz * sd.distance);
            vec3 normal = sphereNormal(sd.sphere, pointAtTime);

            return Hit(
                sd.distance,
                sd.sphere.material,
                normal,
                sd.sphere.point,
                ray
            );
           } else {
            return Hit(
                td.distance,
                td.triangle.material,
                td.triangle.normal,
                td.intersectPoint,
                ray
            );
           }
       }


       if (sd.distance >= 0.0) {
        vec3 pointAtTime = ray.point + vec3(ray.vector.xyz * sd.distance);
        vec3 normal = sphereNormal(sd.sphere, pointAtTime);

        return Hit(
            sd.distance,
            sd.sphere.material,
            normal,
            sd.sphere.point,
            ray
        );
       }

       return Hit(
            td.distance,
            td.triangle.material,
            td.triangle.normal,
            td.intersectPoint,
            ray
        );
    }

    vec4 cast1(Ray ray) {
        Hit hit = trace(ray);

        if (hit.distance < 0.0) {
            return bgColour;
        }

        return surfacePhong(hit);
    }

    vec4 cast2(Ray ray) {
        Hit hit = trace(ray);

        if (hit.distance < 0.0) {
            return bgColour;
        }

        return surfacePhong(hit);
    }

    vec4 cast3(Ray ray) {
        Hit hit = trace(ray);

        if (hit.distance < 0.0) {
            return bgColour;
        }

        return surfacePhong(hit);
    }

    vec3 sphereNormal(Sphere sphere, vec3 pos) {
        return normalize(pos - sphere.point);
    }

    SphereDistance intersectSpheres(Ray ray) {
        SphereDistance sd = SphereDistance(-1.0, Sphere(
            vec3(0.0, 0.0, 0.0), 
            -1.0,
            Material(vec3(0.0, 0.0, 0.0), 0.0, 0.0, 0.0)));
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
        TriangleDistance least = TriangleDistance(
            -1.0, 
            Triangle(
                vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.0), 
                vec3(0.0, 0.0, 0.0), 
                Material(vec3(0.0, 0.0, 0.0), 0.0, 0.0, 0.0)),
            vec3(0.0, 0.0, 0.0),
            0.0,
            0.0);

        for (int i = 0; i < ${triangleCount}; i += 1) {
            Triangle t = triangles[i];
            TriangleDistance td = triangleIntersection(t, ray);
            if (td.distance >= 0.0) {
                if (least.distance <= 0.0 || td.distance < least.distance) {
                    least = td;
                }
            }
        }
        return least;
    }

    TriangleDistance triangleIntersection(Triangle triangle, Ray ray) {
        TriangleDistance td = TriangleDistance(
            -1.0, 
            triangle,
            vec3(0.0, 0.0, 0.0),
            0.0,
            0.0);
    
        // compute full scale normal
        vec3 v0v1 = triangle.b - triangle.a;
        vec3 v0v2 = triangle.c - triangle.a;
        vec3 pvec = cross(ray.vector, v0v2);
        float det = dot(v0v1, pvec);

        if (abs(det) < ${epsilon}) {
            return td;
        }

        float invDet = 1.0 / det;

        vec3 tvec = ray.point - triangle.a;
        float u = dot(tvec, pvec) * invDet;
        if (u < 0.0 || u > 1.0) {
            return td;
        }

        vec3 qvec = cross(tvec, v0v1);
        float v = dot(ray.vector, qvec) * invDet;
        if (v < 0.0 || (u + v) > 1.0) {
            return td;
        }

        td.u = u;
        td.v = v;
        td.distance = dot(v0v2, qvec) * invDet;
        td.intersectPoint = vec3(triangle.a.xyz + u * v0v1.xyz + v * v0v2.xyz);

        return td;
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
        Ray ray = Ray(pt + vec3(normal.xyz + ${epsilon}), unit);
        SphereDistance sd = intersectSpheres(ray);

        if (sd.distance < 0.0) {
            return true;
        }

        TriangleDistance td = intersectTriangles(ray);

        return td.distance < 0.0;
    }

    vec4 surfacePhong(Hit hit) {
        vec3 fullColour = vec3(hit.material.colour.rgb / 255.0);
        vec3 diffuse = vec3(0.0, 0.0, 0.0);
        vec3 specular = vec3(0.0, 0.0, 0.0);

        for (int i = 0; i < ${lightCount}; i += 1) {
            if (isLightVisible(hit.position, pointLights[i], hit.normal) == true) {
                vec3 lightColour = vec3(1.0, 1.0, 1.0);
                vec3 lightDir = normalize(pointLights[i].point - hit.position);
                float lightIntensity = 1.0;

                // diffuse
                float dco = dot(hit.normal, lightDir);
                if (dco < 0.0) { dco = 0.0; }

                diffuse += vec3(fullColour.rgb * lightIntensity * dco);

                // specular
                vec3 R = reflect(lightDir, hit.normal);
                float sco = dot(R, normalize(hit.ray.vector));
                if (sco < 0.0) { sco = 0.0; }
                
                specular += vec3(lightColour.rgb * lightIntensity * pow(sco, ${phongSpecularExp}));
            }
        }

        // calculate ambient light
        vec3 ambient = vec3(fullColour.rgb * globalAmbientIntensity);
        ambient = vec3(ambient.rgb + (fullColour.rgb * hit.material.ambient));

        return vec4(ambient.rgb + diffuse.rgb * hit.material.lambert + specular.rgb * hit.material.specular, 1.0);
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

const FD = 25;
const g_scene = {
    camera: {
        point: [0, 5, 50] as Matrix3_1,
        fieldOfView: 45,
        rotation: [0, 0, 0] as Matrix3_1,
        up: [0, 1, 0] as Matrix3_1,
    },
    globalAmbientIntensity: 0.002,
    lights: [[-20, 5, 20] as Matrix3_1],
    spheres: [
        {
            type: 'sphere',
            point: [0, 5, -3] as Matrix3_1,
            colour: [100, 0, 0 ] as Matrix3_1,
            specular: 0.2,
            lambert: 0.6,
            ambient: 0.1,
            radius: 3
        },
        {
            type: 'sphere',
            point: [-4, 5, -1] as Matrix3_1,
            colour: [0, 0, 124] as Matrix3_1,
            specular: 0.1,
            lambert: 0.9,
            ambient: 0.0,
            radius: 0.2
        },
        {
            type: 'sphere',
            point: [-4, 5, -1] as Matrix3_1,
            colour: [0, 255, 0] as Matrix3_1,
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
                [3, 7, -7],
                [-5, 7, -7],
                [-5, 5, -7],
            ] as Matrix3_1[],
            colour: [0, 100, 200] as Matrix3_1,
            specular: 0.2,
            lambert: 0.7,
            ambient: 0.1,
        },
        {
            type: 'triangle',
            points: [
                [FD, 0, -FD],
                [-FD, 0, -FD],
                [-FD, 0, FD],
            ] as Matrix3_1[],
            colour: [200, 200, 200] as Matrix3_1,
            specular: 0.2,
            lambert: 0.7,
            ambient: 0.1,
        },
        {
            type: 'triangle',
            points: [
                [-FD, 0, FD],
                [FD, 0, FD],
                [FD, 0, -FD],
            ] as Matrix3_1[],
            colour: [200, 200, 200] as Matrix3_1,
            specular: 0.2,
            lambert: 0.7,
            ambient: 0.1,
        },
    ],
};

type Scene = typeof g_scene;


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
    if (g_scene.triangles[0].points[0][1] > 10.5) {
        zod1 *= -1;
    } else if (g_scene.triangles[0].points[0][1] < 4.5) {
        zod1 *= -1;
    } 
    g_scene.triangles[0].points[0][1] += zod1;

    // set the position of each moon with some trig.
    g_scene.spheres[1].point[0] = Math.sin(planet1) * 3.5;
    g_scene.spheres[1].point[2] = -3 + (Math.cos(planet1) * 3.5);

    g_scene.spheres[2].point[0] = Math.sin(planet2) * 4;
    g_scene.spheres[2].point[2] = -3 + (Math.cos(planet2) * 4);

    g_scene.spheres.forEach((o, i) => {
        uniforms.spheres(i, o.radius, o.point, o.colour, o.ambient, o.lambert, o.specular);
    });

    g_scene.triangles.forEach((t, i) => {
        const v0v1 = subtract3_1(t.points[1], t.points[0]);
        const v0v2 = subtract3_1(t.points[2], t.points[0]);
        const normal = normalize3_1(multiply3_1(v0v1, v0v2));
        uniforms.triangles(i, t.points[0], t.points[1], t.points[2], normal, t.colour, t.ambient, t.lambert, t.specular);
    });

    draw(g_gl, g_ctx);
    requestAnimationFrame(animate);
};
animate();


function setupScene(gl: WebGLRenderingContext, context: ProgramContext, scene: Scene) {
    const { camera, spheres, triangles, lights } = scene;
    const u = getUniformSetters(gl, context.program);

    const cameraMatrix = 
    zRotate4_4(yRotate4_4(xRotate4_4(translate4_4(identity4_4(), camera.point[0], camera.point[1], camera.point[2]), camera.rotation[0]), camera.rotation[1]), camera.rotation[2]);

    const scale = Math.tan(Math.PI * (camera.fieldOfView * 0.5) / 180);

    const width = (gl.canvas as any).clientWidth;
    const height = (gl.canvas as any).clientHeight;

    const aspectRatio =  width / height;
    const origin = [
        cameraMatrix[12],
        cameraMatrix[13],
        cameraMatrix[14],
    ] as Matrix3_1;

    u.aspectRatio(aspectRatio);
    u.cameraMatrix(cameraMatrix);
    u.cameraPos(origin);
    u.globalAmbientIntensity(scene.globalAmbientIntensity);
    u.height(height);
    u.scale(scale);
    u.width(width);

    spheres.forEach((s, i) => {
        u.spheres(i, s.radius, s.point, s.colour, s.ambient, s.lambert, s.specular);
    });

    triangles.forEach((t, i) => {
        const v0v1 = subtract3_1(t.points[1], t.points[0]);
        const v0v2 = subtract3_1(t.points[2], t.points[0]);
        const normal = normalize3_1(multiply3_1(v0v1, v0v2));
        u.triangles(i, t.points[0], t.points[1], t.points[2], normal, t.colour, t.ambient, t.lambert, t.specular);
    });

    lights.forEach((l, i) => {
        u.lights(i, l);
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

function getUniformSetters(gl: WebGLRenderingContext, program: WebGLProgram) {

    const cameraMatrix = getUniformLocation(gl, program, 'cameraMatrix');
    const cameraPos = getUniformLocation(gl, program, 'cameraPos');
    const width = getUniformLocation(gl, program, 'width');
    const globalAmbientIntensity = getUniformLocation(gl, program, 'globalAmbientIntensity');
    const height = getUniformLocation(gl, program, 'height');
    const aspectRatio = getUniformLocation(gl, program, 'aspectRatio');
    const scale = getUniformLocation(gl, program, 'scale');

    const spheres = g_scene.spheres.map((_, i) => {
        return {
            point: getUniformLocation(gl, program, `spheres[${i}].point`),
            radius: getUniformLocation(gl, program, `spheres[${i}].radius`),
            colour: getUniformLocation(gl, program, `spheres[${i}].material.colour`),
            ambient: getUniformLocation(gl, program, `spheres[${i}].material.ambient`),
            lambert: getUniformLocation(gl, program, `spheres[${i}].material.lambert`),
            specular: getUniformLocation(gl, program, `spheres[${i}].material.specular`),
        };
    });

    const triangles = g_scene.triangles.map((_, i) => {
        return {
            a: getUniformLocation(gl, program, `triangles[${i}].a`),
            b: getUniformLocation(gl, program, `triangles[${i}].b`),
            c: getUniformLocation(gl, program, `triangles[${i}].c`),
            normal: getUniformLocation(gl, program, `triangles[${i}].normal`),
            colour: getUniformLocation(gl, program, `triangles[${i}].material.colour`),
            ambient: getUniformLocation(gl, program, `triangles[${i}].material.ambient`),
            lambert: getUniformLocation(gl, program, `triangles[${i}].material.lambert`),
            specular: getUniformLocation(gl, program, `triangles[${i}].material.specular`),
        };
    });

    const lights = g_scene.lights.map((_, i) => {
        return {
            point: getUniformLocation(gl, program, `pointLights[${i}].point`),
        };
    });

    const setVec3 = (loc: WebGLUniformLocation, v: Matrix3_1) => {
        gl.uniform3fv(loc, v);
    };
    const setFloat = (loc: WebGLUniformLocation, f: number) => {
        gl.uniform1f(loc, f);
    };
     
    return {
        aspectRatio(aspect: number) {
            setFloat(aspectRatio, aspect);
        },
        cameraMatrix(matrix: Matrix4_4) {
            gl.uniformMatrix4fv(cameraMatrix, false, matrix);
        },
        cameraPos(pos: Matrix3_1) {
            setVec3(cameraPos, pos);
        },
        globalAmbientIntensity(intensity: number) {
            setFloat(globalAmbientIntensity, intensity);
        },
        height(h: number) {
            setFloat(height, h);
        },
        lights(index: number, point: Matrix3_1) {
            if (!lights[index]) {
                throw new RangeError('out of bounds light');
            }
            setVec3(lights[index].point, point);
        },
        scale(s: number) {
            setFloat(scale, s);
        },
        spheres(index: number, radius: number, point: Matrix3_1, colour: Matrix3_1, ambient: number, lambert: number, specular: number) {
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
        triangles(index: number, a: Matrix3_1, b: Matrix3_1, c: Matrix3_1, normal: Matrix3_1, colour: Matrix3_1, ambient: number, lambert: number, specular: number) {
            if (!triangles[index]) {
                throw new RangeError('out of bounds triangle');
            }
            setVec3(triangles[index].a, a);
            setVec3(triangles[index].b, b);
            setVec3(triangles[index].c, c);
            setVec3(triangles[index].normal, normal);
            setVec3(triangles[index].colour, colour);
            setFloat(triangles[index].ambient, ambient);
            setFloat(triangles[index].lambert, lambert);
            setFloat(triangles[index].specular, specular);
        },
        width(w: number) {
            setFloat(width, w);
        },
    };
}

function resize(canvas: HTMLCanvasElement) {
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
