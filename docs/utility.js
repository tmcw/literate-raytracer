// ## Utility Functions
// Utility functions can help us make our code more readable
//
// <a name="throwIfFalsey"></a>
// ## Throw If Falsey
// Throw an error if `thingToTest` is false like
// _optionally_ we'll take a custom `Error` constructor
function throwIfFalsey(thingToTest, reason, Ctor = Error) {
    if (!thingToTest) {
        throw new Ctor(`Literate Ray Tracer: ${reason}`);
    }
}
//
// <a name="setupScene"></a>
// ## setupScene
function setupScene(gl, context, scene, shaderConfig) {
    const { camera, materials, spheres, triangleNormals, lights } = scene;
    // in typscript we're cheating with an any here
    const u = getUniformSetters(gl, context.program, getUniformDescription(shaderConfig));
    const cameraMatrix = zRotate4_4(yRotate4_4(xRotate4_4(translate4_4(identity4_4(), camera.point[0], camera.point[1], camera.point[2]), camera.rotation[0]), camera.rotation[1]), camera.rotation[2]);
    const scale = Math.tan(Math.PI * (camera.fieldOfView * 0.5) / 180);
    const width = gl.canvas.clientWidth;
    const height = gl.canvas.clientHeight;
    const aspectRatio = width / height;
    const origin = [
        cameraMatrix[12],
        cameraMatrix[13],
        cameraMatrix[14],
    ];
    u.aspectRatio(aspectRatio);
    u.cameraMatrix(cameraMatrix);
    u.cameraPos(origin);
    u.globalAmbientIntensity(scene.globalAmbientIntensity);
    u.height(height);
    u.scale(scale);
    u.width(width);
    u.aa(0);
    materials.forEach((m, i) => {
        u.materials[i].colourOrAlbedo(m.colour);
        u.materials[i].ambient(m.ambient);
        u.materials[i].diffuseOrRoughness(m.diffuse);
        u.materials[i].specularOrMetallic(m.specular);
        u.materials[i].refraction(m.refraction);
        u.materials[i].isTranslucent(m.isTranslucent);
    });
    spheres.forEach((s, i) => {
        u.spheres[i].radius(s.radius);
        u.spheres[i].material(s.material);
        u.spheres[i].point(s.point);
    });
    lights.forEach((l, i) => {
        u.pointLights[i].point(l);
    });
    triangleNormals((normal, t, i) => {
        u.triangles[i].a(t.points[0]);
        u.triangles[i].b(t.points[1]);
        u.triangles[i].c(t.points[2]);
        u.triangles[i].normal(normal);
        u.triangles[i].material(t.material);
    }, false);
    return u;
}
//
// <a name="getUniformLocation"></a>
// ## getUniformLocation
function getUniformLocation(gl, program, name) {
    const location = gl.getUniformLocation(program, name);
    if (!location) {
        throw new Error('could not get uniform location ' + name);
    }
    return location;
}
//
// <a name="getUniformSetters"></a>
// ## getUniformSetters
function getUniformSetters(gl, program, desc) {
    const setVec3 = (loc, v) => {
        gl.uniform3fv(loc, v);
    };
    const setFloat = (loc, f) => {
        gl.uniform1f(loc, f);
    };
    const setInt = (loc, i) => {
        gl.uniform1i(loc, i);
    };
    const buildSetter = ({ name, type }, prefix, postfix) => {
        const loc = getUniformLocation(gl, program, prefix + name + postfix);
        switch (type) {
            case 'int':
                return (value) => setInt(loc, value);
            case 'float':
                return (value) => setFloat(loc, value);
            case 'mat4':
                return (value) => gl.uniformMatrix4fv(loc, false, value);
            case 'vec3':
                return (value) => setVec3(loc, value);
            default:
                throw new Error('unsupported GLSL type ' + type);
        }
    };
    const createReduceUniformDescription = (prefix) => (dictionary, d) => {
        const { children, length, name } = d;
        if (length && children && children.length) {
            const arr = [];
            dictionary[name] = arr;
            for (let i = 0; i < length; i += 1) {
                arr.push(children.reduce(createReduceUniformDescription(prefix + name + `[${i}].`), {}));
            }
        }
        else if (length) {
            const arr = [];
            dictionary[name] = arr;
            for (let i = 0; i < length; i += 1) {
                arr.push(buildSetter(d, prefix, `[${i}]`));
            }
        }
        else if (children && children.length) {
            dictionary[name] = children.reduce(createReduceUniformDescription(prefix + name + '.'), {});
        }
        else {
            dictionary[name] = buildSetter(d, prefix, '');
        }
        return dictionary;
    };
    return desc.reduce(createReduceUniformDescription(''), {});
}
