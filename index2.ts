const c = document.getElementById('c') as HTMLCanvasElement;
const width = 640;
const height = 480;

c.width = width;
c.height = height;
c.style.cssText = 'width:' + (width) + 'px;height:' + (height) + 'px';

interface ProgramContext {
    positionBuffer: WebGLBuffer;
    positionLocation: number;
    program: WebGLProgram;
}

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
       float xNorm = (gl_FragCoord.x / 255.0 / 640.0) * 255.0;
       float yNorm = (gl_FragCoord.y / 255.0 / 480.0) * 255.0;
       
       gl_FragColor = vec4(xNorm, yNorm, 0.8, 1.0);
    }
`;

const ctx = bindProgram(g_gl);
draw(g_gl, ctx);

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



const scene = {
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
            color: {
                x: 155,
                y: 200,
                z: 155
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
            color: {
                x: 155,
                y: 155,
                z: 155
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
            color: {
                x: 255,
                y: 255,
                z: 255
            },
            specular: 0.2,
            lambert: 0.7,
            ambient: 0.1,
            radius: 0.1
        }
    ],
};

// function render(scene) {
//     // first 'unpack' the scene to make it easier to reference
//     var camera = scene.camera,
//         objects = scene.objects,
//         lights = scene.lights;

//     // This process
//     // is a bit odd, because there's a disconnect between pixels and vectors:
//     // given the left and right, top and bottom rays, the rays we shoot are just
//     // interpolated between them in little increments.
//     //
//     // Starting with the height and width of the scene, the camera's place,
//     // direction, and field of view, we calculate factors that create
//     // `width*height` vectors for each ray

//     // Start by creating a simple vector pointing in the direction the camera is
//     // pointing - a unit vector
//     var eyeVector = Vector.unitVector(Vector.subtract(camera.vector, camera.point)),

//         // and then we'll rotate this by combining it with a version that's turned
//         // 90° right and one that's turned 90° up. Since the [cross product](http://en.wikipedia.org/wiki/Cross_product)
//         // takes two vectors and creates a third that's perpendicular to both,
//         // we use a pure 'UP' vector to turn the camera right, and that 'right'
//         // vector to turn the camera up.
//         vpRight = Vector.unitVector(Vector.crossProduct(eyeVector, Vector.UP)),
//         vpUp = Vector.unitVector(Vector.crossProduct(vpRight, eyeVector)),

//         // The actual ending pixel dimensions of the image aren't important here -
//         // note that `width` and `height` are in pixels, but the numbers we compute
//         // here are just based on the ratio between them, `height/width`, and the
//         // `fieldOfView` of the camera.
//         fovRadians = Math.PI * (camera.fieldOfView / 2) / 180,
//         heightWidthRatio = height / width,
//         halfWidth = Math.tan(fovRadians),
//         halfHeight = heightWidthRatio * halfWidth,
//         camerawidth = halfWidth * 2,
//         cameraheight = halfHeight * 2,
//         pixelWidth = camerawidth / (width - 1),
//         pixelHeight = cameraheight / (height - 1);

//     var index, color;
//     var ray = {
//         point: camera.point
//     };
//     for (var x = 0; x < width; x++) {
//         for (var y = 0; y < height; y++) {

//             // turn the raw pixel `x` and `y` values into values from -1 to 1
//             // and use these values to scale the facing-right and facing-up
//             // vectors so that we generate versions of the `eyeVector` that are
//             // skewed in each necessary direction.
//             var xcomp = Vector.scale(vpRight, (x * pixelWidth) - halfWidth),
//                 ycomp = Vector.scale(vpUp, (y * pixelHeight) - halfHeight);

//             ray.vector = Vector.unitVector(Vector.add3(eyeVector, xcomp, ycomp));

//             // use the vector generated to raytrace the scene, returning a color
//             // as a `{x, y, z}` vector of RGB values
//             color = trace(ray, scene, 0);
//             index = (x * 4) + (y * width * 4),
//             data.data[index + 0] = color.x;
//             data.data[index + 1] = color.y;
//             data.data[index + 2] = color.z;
//             data.data[index + 3] = 255;
//         }
//     }

//     // Now that each ray has returned and populated the `data` array with
//     // correctly lit colors, fill the canvas with the generated data.
//     ctx.putImageData(data, 0, 0);
// }
