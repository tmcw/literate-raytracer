//
// <a name="crateShader"></a>
// ### createShader
//
// We need a mechanism for compiling shader programs and checking if they failed to compile.
// In this case `type` is a property of the brower's `WebGLRenderingContext`
function createShader(gl, type, source) {
    // WebGL is flexible.  Before we even compile the sahder we need to allocate
    // a place to store it in the GPU, lets do that now
    const shader = gl.createShader(type);
    throwIfFalsey(shader, 'could not create shader: ' + source);
    // with some memory in hand we can load in some source code and compile
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    // we need to manually confirm that everything is okay
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    // if it's not okay let's figure out why
    const log = gl.getShaderInfoLog(shader);
    // and we'll clean up
    gl.deleteShader(shader);
    throwIfFalsey(false, 'shader error: ' + log + '\n\n' + source);
}
//
// <a name="crateProgram"></a>
// ### createProgram
//
// WebGL programs have two components, vertex shaders, and fragment shaders.
// Because WebGL is flexibile we could conceivably use one vertex shader with
// multiple fragment shaders, or vice versa.
//
// In order to make a working program we need to `link` a vertex shader and a
// fragment shader
function createProgram(gl, vertexShader, fragmentShader) {
    // first let's get some memory to store the program
    const program = gl.createProgram();
    // and make sure we get that memory
    throwIfFalsey(program, 'could not create GL program');
    // then we can attach the two shaders via reference
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    // and finally call link
    gl.linkProgram(program);
    // Again, we need to manually check for success
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    // and if things are bad, let's find out why
    const log = gl.getProgramInfoLog(program);
    // and clean up
    gl.deleteProgram(program);
    throwIfFalsey(false, 'could not compile GL: ' + log);
}
//
// <a name="bindProgram"></a>
// ### bindProgram
//
// Our shader approach is fairly simple and we don't need much flexibility
// `bindProgram` sets up an opinionated vertex shader and a somewhat more flexibile
// fragment shader..
function bindProgram(gl, vertexSource, fragmentSource) {
    // let's compile the shaders and link the program
    const vs = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = createProgram(gl, vs, fs);
    // our [vertex shader](./shader.html#vertexShader "our vertex shader's source") is strongly 
    // opinionated. We need to bind our position data for a quad (two triangles) to the program
    // but first we need to get the position location
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    // Next we need some memory in the GPU to upload the data to
    const positionBuffer = gl.createBuffer();
    // we might not get memory, let's make sure
    throwIfFalsey(positionBuffer, 'fail to get position buffer');
    // okay, tell the GPU/WebGL where in memory we want to upload
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // then let's upload six vertices for the two triangles that will make up our
    // rectangular display
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
        -1, 1,
        1, -1,
        1, -1,
        -1, 1,
        1, 1,
    ]), gl.STATIC_DRAW);
    // because we have a simple workflow we can mostly assume we're using this opinionated
    // program
    gl.useProgram(program);
    // finally let's wrap up the impportant bits in an object and give them to our consumer
    return {
        positionBuffer,
        positionLocation,
        program,
    };
}
//
// <a name="draw"></a>
// ### draw
//
// each time we want to render a frame we need to setup the program's data the way we want it
// then press "go".  This `draw` function is our "go" button.
function draw(gl, context, canvas) {
    // if the screen resized, re-initatlize the scene
    if (resize(canvas)) {
        setupScene(gl, context, g_scene, g_configShader);
    }
    // clear the screen
    gl.clear(gl.COLOR_BUFFER_BIT);
    // make sure our rectangle is setup
    gl.enableVertexAttribArray(context.positionLocation);
    gl.vertexAttribPointer(context.positionLocation, 2, gl.FLOAT, false, 0, 0);
    // draw the rectangle (2 triangles, 6 vertices)
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}
//
// <a name="getUniformDescription"></a>
// ### getUniformDescription
//
// what variables are bound to our program?
function getUniformDescription(shaderConfig) {
    return [
        {
            name: 'aa',
            type: 'int',
        },
        {
            name: 'aspectRatio',
            type: 'float',
        },
        {
            name: 'cameraMatrix',
            type: 'mat4',
        },
        {
            name: 'cameraPos',
            type: 'vec3',
        },
        {
            name: 'globalAmbientIntensity',
            type: 'float',
        },
        {
            name: 'height',
            type: 'float',
        },
        {
            name: 'scale',
            type: 'float',
        },
        {
            name: 'shadingModel',
            type: 'int',
        },
        {
            name: 'width',
            type: 'float',
        },
        {
            children: [
                {
                    name: 'colourOrAlbedo',
                    type: 'vec3',
                },
                {
                    name: 'ambient',
                    type: 'float',
                },
                {
                    name: 'diffuseOrRoughness',
                    type: 'float',
                },
                {
                    name: 'isTranslucent',
                    type: 'int',
                },
                {
                    name: 'refraction',
                    type: 'float',
                },
                {
                    name: 'specularOrMetallic',
                    type: 'float',
                },
            ],
            length: shaderConfig.materialCount,
            name: 'materials',
            type: 'struct',
        },
        {
            children: [
                {
                    name: 'point',
                    type: 'vec3',
                },
            ],
            length: shaderConfig.lightCount,
            name: 'pointLights',
            type: 'struct'
        },
        {
            children: [
                {
                    name: 'material',
                    type: 'int',
                },
                {
                    name: 'point',
                    type: 'vec3',
                },
                {
                    name: 'radius',
                    type: 'float',
                },
            ],
            length: shaderConfig.sphereCount,
            name: 'spheres',
            type: 'struct',
        },
        {
            children: [
                {
                    name: 'a',
                    type: 'vec3',
                },
                {
                    name: 'b',
                    type: 'vec3',
                },
                {
                    name: 'c',
                    type: 'vec3',
                },
                {
                    name: 'material',
                    type: 'int',
                },
                {
                    name: 'normal',
                    type: 'vec3',
                },
            ],
            length: shaderConfig.triangleCount,
            name: 'triangles',
            type: 'struct',
        },
    ];
}
