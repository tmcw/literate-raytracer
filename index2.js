"use strict";
const c = document.getElementById('c');
const width = 640;
const height = 480;
c.width = width;
c.height = height;
c.style.cssText = 'width:' + (width) + 'px;height:' + (height) + 'px';
const g_gl = c.getContext('webgl');
if (!g_gl) {
    throw new Error('fail to launch gl');
}
const vertexSource = `
    attribute vec4 a_position;
     
    varying vec2 v_texcoord;
     
    void main() {
       gl_Position = a_position;
    }
`;
const fragmentSource = `precision mediump float;
     
    varying vec2 v_texcoord;
     
    void main() {
       float xNorm = gl_FragCoord.x / 640.0;
       float yNorm = gl_FragCoord.y / 480.0;
       gl_FragColor = vec4(xNorm, yNorm, 0.8, 1.0);
    }
`;
const ctx = bindProgram(g_gl);
draw(g_gl, ctx);
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
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enableVertexAttribArray(context.positionLocation);
    gl.vertexAttribPointer(context.positionLocation, 2, gl.FLOAT, false, 0, 0);
    // draw the quad (2 triangles, 6 vertices)
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}
