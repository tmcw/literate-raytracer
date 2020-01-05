// ## GL 
interface ProgramContext {
    positionBuffer: WebGLBuffer;
    positionLocation: number;
    program: WebGLProgram;
}

function bindProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string): ProgramContext {
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
function draw(gl: WebGLRenderingContext, context: ProgramContext, canvas: HTMLCanvasElement) {
    if (resize(canvas)) {
        setupScene(gl, context, g_scene);
    }
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enableVertexAttribArray(context.positionLocation);
    gl.vertexAttribPointer(context.positionLocation, 2, gl.FLOAT, false, 0, 0);

    // draw the quad (2 triangles, 6 vertices)
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}