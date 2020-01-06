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
function setupScene(gl, context, scene) {
    const { camera, materials, spheres, triangles, lights } = scene;
    const u = getUniformSetters(gl, context.program);
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
    materials.forEach((m, i) => {
        u.materials(i, m.colour, m.ambient, m.diffuse, m.specular, m.refraction, m.isTranslucent);
    });
    spheres.forEach((s, i) => {
        u.spheres(i, s.radius, s.material, s.point);
    });
    lights.forEach((l, i) => {
        u.lights(i, l);
    });
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
function getUniformSetters(gl, program) {
    const cameraMatrix = getUniformLocation(gl, program, 'cameraMatrix');
    const cameraPos = getUniformLocation(gl, program, 'cameraPos');
    const width = getUniformLocation(gl, program, 'width');
    const globalAmbientIntensity = getUniformLocation(gl, program, 'globalAmbientIntensity');
    const height = getUniformLocation(gl, program, 'height');
    const aspectRatio = getUniformLocation(gl, program, 'aspectRatio');
    const scale = getUniformLocation(gl, program, 'scale');
    const materials = g_scene.materials.map((_, i) => {
        return {
            colour: getUniformLocation(gl, program, `materials[${i}].colourOrAlbedo`),
            ambient: getUniformLocation(gl, program, `materials[${i}].ambient`),
            diffuse: getUniformLocation(gl, program, `materials[${i}].diffuseOrRoughness`),
            isTranslucent: getUniformLocation(gl, program, `materials[${i}].isTranslucent`),
            refraction: getUniformLocation(gl, program, `materials[${i}].refraction`),
            specular: getUniformLocation(gl, program, `materials[${i}].specularOrMetallic`),
        };
    });
    const spheres = g_scene.spheres.map((_, i) => {
        return {
            material: getUniformLocation(gl, program, `spheres[${i}].material`),
            point: getUniformLocation(gl, program, `spheres[${i}].point`),
            radius: getUniformLocation(gl, program, `spheres[${i}].radius`),
        };
    });
    const triangles = g_scene.triangles.map((_, i) => {
        return {
            a: getUniformLocation(gl, program, `triangles[${i}].a`),
            b: getUniformLocation(gl, program, `triangles[${i}].b`),
            c: getUniformLocation(gl, program, `triangles[${i}].c`),
            material: getUniformLocation(gl, program, `triangles[${i}].material`),
            normal: getUniformLocation(gl, program, `triangles[${i}].normal`),
        };
    });
    const lights = g_scene.lights.map((_, i) => {
        return {
            point: getUniformLocation(gl, program, `pointLights[${i}].point`),
        };
    });
    const setVec3 = (loc, v) => {
        gl.uniform3fv(loc, v);
    };
    const setFloat = (loc, f) => {
        gl.uniform1f(loc, f);
    };
    const setInt = (loc, i) => {
        gl.uniform1i(loc, i);
    };
    return {
        aspectRatio(aspect) {
            setFloat(aspectRatio, aspect);
        },
        cameraMatrix(matrix) {
            gl.uniformMatrix4fv(cameraMatrix, false, matrix);
        },
        cameraPos(pos) {
            setVec3(cameraPos, pos);
        },
        globalAmbientIntensity(intensity) {
            setFloat(globalAmbientIntensity, intensity);
        },
        height(h) {
            setFloat(height, h);
        },
        lights(index, point) {
            if (!lights[index]) {
                throw new RangeError('out of bounds light');
            }
            setVec3(lights[index].point, point);
        },
        materials(index, colourOrAlbedo, ambient, diffuseOrRoughness, specularOrMetallic, refraction, isTranslucent) {
            setVec3(materials[index].colour, colourOrAlbedo);
            setFloat(materials[index].ambient, ambient);
            setFloat(materials[index].diffuse, diffuseOrRoughness);
            setFloat(materials[index].refraction, refraction);
            setFloat(materials[index].specular, specularOrMetallic);
            setInt(materials[index].isTranslucent, isTranslucent ? 1 : 0);
        },
        scale(s) {
            setFloat(scale, s);
        },
        spheres(index, radius, materialIndex, point) {
            if (!spheres[index]) {
                throw new RangeError('out of bounds sphere');
            }
            setVec3(spheres[index].point, point);
            setFloat(spheres[index].radius, radius);
            setInt(spheres[index].material, materialIndex);
        },
        triangles(index, a, b, c, materialIndex, normal) {
            if (!triangles[index]) {
                throw new RangeError('out of bounds triangle');
            }
            setVec3(triangles[index].a, a);
            setVec3(triangles[index].b, b);
            setVec3(triangles[index].c, c);
            setVec3(triangles[index].normal, normal);
            setInt(triangles[index].material, materialIndex);
        },
        width(w) {
            setFloat(width, w);
        },
    };
}