"use strict";
const negInfinity = [-Infinity, -Infinity, -Infinity];
const posInfinity = [Infinity, Infinity, Infinity];
class BBox {
    constructor(min = BBox.negInfinity, max = BBox.posInfinity) {
        this.bounds = [BBox.negInfinity, BBox.posInfinity];
        this.bounds[0] = min;
        this.bounds[1] = max;
    }
    static create() {
        return new BBox();
    }
    centroid() {
        return [
            (this.bounds[0][0] + this.bounds[1][0]) * 0.5,
            (this.bounds[0][1] + this.bounds[1][1]) * 0.5,
            (this.bounds[0][2] + this.bounds[1][2]) * 0.5,
        ];
    }
    extendBy(p) {
        if (p[0] < this.bounds[0][0]) {
            this.bounds[0][0] = p[0];
        }
        if (p[1] < this.bounds[0][1]) {
            this.bounds[0][1] = p[1];
        }
        if (p[2] < this.bounds[0][2]) {
            this.bounds[0][2] = p[2];
        }
        if (p[0] > this.bounds[1][0]) {
            this.bounds[1][0] = p[0];
        }
        if (p[1] > this.bounds[1][1]) {
            this.bounds[1][1] = p[1];
        }
        if (p[2] > this.bounds[1][2]) {
            this.bounds[1][2] = p[2];
        }
        return this;
    }
    min() {
        return this.bounds[0];
    }
    max() {
        return this.bounds[1];
    }
}
BBox.negInfinity = [-Infinity, -Infinity, -Infinity];
BBox.posInfinity = [Infinity, Infinity, Infinity];
class Extents {
    constructor(numPlaneSetNormals = 7, op = createObjectPool(createMatrix3_1)) {
        this.numPlaneSetNormals = numPlaneSetNormals;
        this.op = op;
        this.d = [];
        for (let i = 0; i < numPlaneSetNormals; ++i) {
            this.d[i] = [Infinity, -Infinity];
        }
    }
    static create(numPlaneSetNormals = 7, op = createObjectPool(createMatrix3_1)) {
        return new Extents(numPlaneSetNormals, op);
    }
    extendBy(e) {
        for (let i = 0; i < this.numPlaneSetNormals; ++i) {
            if (e.d[i][0] < this.d[i][0]) {
                this.d[i][0] = e.d[i][0];
            }
            if (e.d[i][1] > this.d[i][1]) {
                this.d[i][1] = e.d[i][1];
            }
        }
    }
    centroid() {
        const ret = this.op.malloc();
        ret[0] = this.d[0][0] + this.d[0][1] * 0.5;
        ret[1] = this.d[1][0] + this.d[1][1] * 0.5;
        ret[2] = this.d[2][0] + this.d[2][1] * 0.5;
        return ret;
    }
}
class OctreeNode {
    constructor() {
        this.child = [
            null, null, null, null, null, null, null, null,
        ];
        this.isLeaf = true;
        this.nodeExtents = Extents.create();
        this.nodeExtentsList = [];
    }
    static create() {
        return new OctreeNode();
    }
}
class Octree {
    constructor(sceneExtents) {
        this.bbox = BBox.create();
        this.root = OctreeNode.create();
        const xDiff = sceneExtents.d[0][1] - sceneExtents.d[0][0];
        const yDiff = sceneExtents.d[1][1] - sceneExtents.d[1][0];
        const zDiff = sceneExtents.d[2][1] - sceneExtents.d[2][0];
        const maxDiff = Math.max(xDiff, Math.max(yDiff, zDiff));
        const minPlusMax = [
            sceneExtents.d[0][0] + sceneExtents.d[0][1],
            sceneExtents.d[1][0] + sceneExtents.d[1][1],
            sceneExtents.d[2][0] + sceneExtents.d[2][1],
        ];
        this.bbox.bounds[0][0] = (minPlusMax[0] - maxDiff) * 0.5;
        this.bbox.bounds[0][1] = (minPlusMax[1] - maxDiff) * 0.5;
        this.bbox.bounds[0][2] = (minPlusMax[2] - maxDiff) * 0.5;
        this.bbox.bounds[1][0] = (minPlusMax[0] + maxDiff) * 0.5;
        this.bbox.bounds[1][1] = (minPlusMax[1] + maxDiff) * 0.5;
        this.bbox.bounds[1][2] = (minPlusMax[2] + maxDiff) * 0.5;
    }
    static create(sceneExtents) {
        return new Octree(sceneExtents);
    }
    _build(node, bbox) {
        if (node.isLeaf) {
            node.nodeExtentsList.forEach((e) => {
                node.nodeExtents.extendBy(e);
            });
        }
        else {
            for (let i = 0; i < 8; ++i) {
                const child = node.child[i];
                if (child) {
                    const childBBox = BBox.create();
                    ;
                    const centroid = bbox.centroid();
                    // x-axis
                    childBBox.bounds[0][0] = (i & 4) ? centroid[0] : bbox.bounds[0][0];
                    childBBox.bounds[1][0] = (i & 4) ? bbox.bounds[1][0] : centroid[0];
                    // y-axis
                    childBBox.bounds[0][1] = (i & 2) ? centroid[1] : bbox.bounds[0][1];
                    childBBox.bounds[1][1] = (i & 2) ? bbox.bounds[1][1] : centroid[1];
                    // z-axis
                    childBBox.bounds[0][2] = (i & 1) ? centroid[2] : bbox.bounds[0][2];
                    childBBox.bounds[1][2] = (i & 1) ? bbox.bounds[1][2] : centroid[2];
                    // Inspect child
                    this._build(child, childBBox);
                    // Expand extents with extents of child
                    node.nodeExtents.extendBy(child.nodeExtents);
                }
            }
        }
    }
    _insert(node, extents, bbox, depth) {
        if (node.isLeaf) {
            if (node.nodeExtentsList.length === 0 || depth === Octree.MAX_DEPTH) {
                node.nodeExtentsList.push(extents);
            }
            else {
                node.isLeaf = false;
                // Re-insert extents held by this node
                while (node.nodeExtentsList.length) {
                    const ne = node.nodeExtentsList.pop();
                    if (!ne) {
                        break;
                    }
                    this._insert(node, ne, bbox, depth);
                }
                // Insert new extent
                this._insert(node, extents, bbox, depth);
            }
        }
        else {
            // Need to compute in which child of the current node this extents should
            // be inserted into
            const extentsCentroid = extents.centroid();
            const nodeCentroid = [
                (bbox.bounds[0][0] + bbox.bounds[1][0]) * 0.5,
                (bbox.bounds[0][1] + bbox.bounds[1][1]) * 0.5,
                (bbox.bounds[0][2] + bbox.bounds[1][2]) * 0.5,
            ];
            let childBBox = BBox.create();
            let childIndex = 0;
            // x-axis
            if (extentsCentroid[0] > nodeCentroid[0]) {
                childIndex = 4;
                childBBox.bounds[0][0] = nodeCentroid[0];
                childBBox.bounds[1][0] = bbox.bounds[1][0];
            }
            else {
                childBBox.bounds[0][0] = bbox.bounds[0][0];
                childBBox.bounds[1][0] = nodeCentroid[0];
            }
            // y-axis
            if (extentsCentroid[1] > nodeCentroid[1]) {
                childIndex += 2;
                childBBox.bounds[0][1] = nodeCentroid[1];
                childBBox.bounds[1][1] = bbox.bounds[1][1];
            }
            else {
                childBBox.bounds[0][1] = bbox.bounds[0][1];
                childBBox.bounds[1][1] = nodeCentroid[1];
            }
            // z-axis
            if (extentsCentroid[2] > nodeCentroid[2]) {
                childIndex += 1;
                childBBox.bounds[0][2] = nodeCentroid[2];
                childBBox.bounds[1][2] = bbox.bounds[1][2];
            }
            else {
                childBBox.bounds[0][2] = bbox.bounds[0][2];
                childBBox.bounds[1][2] = nodeCentroid[2];
            }
            // Create the child node if it doesn't exsit yet and then insert the extents in it
            let nc = node.child[childIndex];
            if (nc === null) {
                nc = OctreeNode.create();
                node.child[childIndex] = nc;
            }
            this._insert(nc, extents, childBBox, depth + 1);
        }
    }
    build() {
        this._build(this.root, this.bbox);
    }
    insert(extents) {
        this._insert(this.root, extents, this.bbox, 0);
    }
}
Octree.MAX_DEPTH = 16;
const g_cube = (function () {
    const points = [
        // front face
        0.5,
        -0.5,
        -0.5,
        -0.5,
        -0.5,
        -0.5,
        0.5,
        0.5,
        -0.5,
        0.5,
        0.5,
        -0.5,
        -0.5,
        -0.5,
        -0.5,
        -0.5,
        0.5,
        -0.5,
        // right face
        0.5,
        -0.5,
        0.5,
        0.5,
        -0.5,
        -0.5,
        0.5,
        0.5,
        -0.5,
        0.5,
        -0.5,
        0.5,
        0.5,
        0.5,
        -0.5,
        0.5,
        0.5,
        0.5,
        // back face
        -0.5,
        -0.5,
        0.5,
        0.5,
        -0.5,
        0.5,
        0.5,
        0.5,
        0.5,
        -0.5,
        -0.5,
        0.5,
        0.5,
        0.5,
        0.5,
        -0.5,
        0.5,
        0.5,
        // left face
        -0.5,
        0.5,
        -0.5,
        -0.5,
        -0.5,
        -0.5,
        -0.5,
        -0.5,
        0.5,
        -0.5,
        0.5,
        -0.5,
        -0.5,
        -0.5,
        0.5,
        -0.5,
        0.5,
        0.5,
        // top
        0.5,
        0.5,
        -0.5,
        -0.5,
        0.5,
        -0.5,
        -0.5,
        0.5,
        0.5,
        0.5,
        0.5,
        -0.5,
        -0.5,
        0.5,
        0.5,
        0.5,
        0.5,
        0.5,
        // bottom
        -0.5,
        -0.5,
        -0.5,
        0.5,
        -0.5,
        -0.5,
        0.5,
        -0.5,
        0.5,
        0.5,
        -0.5,
        0.5,
        -0.5,
        -0.5,
        0.5,
        -0.5,
        -0.5,
        -0.5,
    ].map((p) => (p * 3.2) + 5.1);
    const triangles = [];
    for (let i = 0; i < points.length; i += 9) {
        triangles.push({
            type: 'triangle',
            material: 5,
            points: [
                [points[i + 0], points[i + 1], points[i + 2]],
                [points[i + 3], points[i + 4], points[i + 5]],
                [points[i + 6], points[i + 7], points[i + 8]],
            ],
        });
    }
    return triangles;
}());
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
// ## HTML
// it all begins with HTML somewhere out there we want a canvas to draw on, 
// we could create one, but for the purposes of this document it will be easier
// for us to ask the host HTML file to provide us a canvas element named `"c"`
function getHtmlCanvas() {
    const canvas = window.document.getElementById('c');
    // to keep things simple we're working in the global browser space, and we'll note
    // that with a `g_` prefix
    // let's make sure our host HTML document provided us a canvas
    // and in the spirit of readable error messages we'll use a [utility function](utility.html#throwIfFalsey "Utility Functions for Literate Ray Tracer")
    throwIfFalsey(canvas, 'requires an HTML canvas element with the id "c"');
    // we'll want to [resize](#resize, "Resize documentation")
    // to make sure our canvas is using all of the space it can
    resize(canvas);
    return canvas;
}
//
// <a name="resize"></a>
// ### Handling Resizes
//
// when working with a canvas we might want to be able to respond to resizes
// of the browser window.  Let' handle that case
function resize(canvas) {
    // We'll lookup the size the browser is displaying the canvas.
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    // Then we'll check if the canvas is not the same size.
    if (canvas.width != displayWidth || canvas.height != displayHeight) {
        // If we have to, we'll make the canvas the same size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        // Let's give ourselves a signal that we _did_ resize
        return true;
    }
    // In the case we did _not_ resize we should also alert our invoker
    return false;
}
function createElement(type) {
    const el = window.document.createElement(type);
    throwIfFalsey(el, 'could not create ' + type + ' html element');
    return el;
}
// numeric input will be used in several places
function createNumericInput(init, onChange) {
    const input = createElement('input');
    input.type = 'number';
    input.value = init + '';
    const onUpdate = (e) => {
        const n = parseInt(e.target.value, 10);
        onChange(n);
    };
    input.addEventListener('change', onUpdate);
    input.addEventListener('blur', onUpdate);
    return {
        element: input,
        free: () => {
            input.removeEventListener('change', onUpdate);
            input.removeEventListener('blur', onUpdate);
        },
    };
}
// buttons are a useful control to have
function createButton(label, onClick) {
    const element = createElement('button');
    element.innerHTML = label;
    const on = () => onClick();
    element.addEventListener('click', on);
    return {
        element,
        free: () => element.removeEventListener('click', on),
    };
}
// we'll want to be able to toggle things
function createToggleButton(labelA, labelB, onToggle) {
    // let's make a toggle button
    const element = createElement('button');
    // we'll use `labelA` as the first state
    let label = labelA;
    element.innerHTML = label;
    // and we'll want to manage the label and report clicks
    const onClick = () => {
        // swap the labels
        if (label === labelA) {
            label = labelB;
        }
        else {
            label = labelA;
        }
        element.innerHTML = label;
        // inform the consumer
        onToggle();
    };
    // attach the handler
    element.addEventListener('click', onClick);
    // return the element so it can be mounted
    // also provide a mechanism to release the event listener
    return {
        element,
        free: () => element.removeEventListener('click', onClick),
    };
}
// drop downs are one way to let people select between a few choices
function createDropDown(list, selected, onSelect) {
    const select = createElement('select');
    list.map((label, i) => {
        const option = createElement('option');
        if (i === selected) {
            option.selected = true;
        }
        option.value = i + '';
        option.innerHTML = label;
        select.appendChild(option);
        return option;
    });
    const onChange = (e) => {
        onSelect(parseInt(e.target.value, 10));
    };
    select.addEventListener('change', onChange);
    select.addEventListener('blur', onChange);
    return {
        element: select,
        free: () => {
            select.removeEventListener('change', onChange);
            select.removeEventListener('blour', onChange);
        },
    };
}
// and we'll provide a way to bind the optional input controls
function bindInputControls(state) {
    const inputArea = window.document.getElementById('i');
    if (!inputArea) {
        return;
    }
    const controls = [
        createToggleButton('pause', 'resume', () => {
            if (state.isAnimating) {
                state.isAnimating = false;
            }
            else {
                state.isAnimating = true;
                animate(0);
            }
        }),
        createDropDown(['PBR', 'Blinn Phong'], 0, (index) => {
            if (index === 1) {
                state.shadingModel = 1;
            }
            else {
                state.shadingModel = 0;
            }
        }),
        createDropDown(['0x AA', '2x AA', '4x AA'], 0, (index) => {
            if (index === 4) {
                state.aa = 4;
            }
            else if (index === 2) {
                state.aa = 2;
            }
            else {
                state.aa = 0;
            }
        }),
    ];
    controls.forEach(control => {
        inputArea.appendChild(control.element);
    });
    return () => {
        controls.forEach((control) => control.free());
    };
}
// Welcome to the Literate Ray Tracer, a program that reads like a book.
// This book is a long winded fork of [Tom Macwright's](https://github.com/tmcw/literate-raytracer "tom macwright's literate ray tracer")
// In addition to Tom's work, the following websights were leveraged extensively
//
// * [WebGL Fundamentals](https://webglfundamentals.org/ "WebGL Fundamentals, a great source for learning WebGL from scratch"), for learning to grok WebGL
// * [Learn OpenGL](https://learnopengl.com/ "Learn OpenGL, a great source for traditional and PBR approaches to lighting and 3D"), for getting a better handle on lighting
// * [Scratchapixel](https://www.scratchapixel.com/ "Scratchapixel has loads of details on the maths behind raytracing and rasterization as well as loads of source code"), for ray tracing and more
// 
// ## How To Read This Book
//
// With any luck this book reads like any other "book" on the web in 2020
// with the literate programming twist that there's real running code snippets
// inbetween prose.
//
// The code is all real and is [written in TypeScript](https://github.com/bennett000/literate-raytracer "Literate Ray Tracer")
// and runs in a slightly "simpler" way than most web apps in 2020.
//
// To keep it simple,
//   1.  The code is all here, no libraries required
//   2.  The code all executes in the global browser space, no official "modules"
//   3.  Performance is _not_ prioritized, it's not ignored entirely but the focus is on simplicity
//
// Please [report and defects here](https://github.com/bennett000/literate-raytracer/issues "Report an issue with the book") and we'll attempt to address the issue in the next release
//
//
// ## 30,000 Foot View
//
// We're going to be working in a prety "weird" way for most JS devs, and many other devs.
// Web developers are already used to jumping from HTML to JS to CSS and back.  On top of
// that we're going to be jumping into [GLSL](https://www.khronos.org/opengl/wiki/Core_Language_(GLSL) "GL Shader Language")
// specifically an older version that is used on embedded devices and the web.  It's somewhat
// like a simplified C with a dash of C++
//
// ### Tech Overview
//
// * HTML + CSS show the 3D graphics output in a canvas
// * JavaScript controls the HTML and orchestrates the GLSL program(s)
// * GLSL compiles and runs on the GPU (video card)
//
// ### Ray Tracer Overview
//
// We'll assume the audience knows what a ray tracer is, if not, checkout the links
// at the top and wikipedia.
//
// This particular ray tracer is built to show people a bunch of fun graphics things that
// can be done in a relatively cross compatible way in the browser.  We're using WebGL
// 1.x to keep it as compatable as possible. 
//
// The high level algorithm is:
//
//  1.  For each frame JavaScript will update a 3D universe and inform the GPU
//  2.  For each _pixel_ in each frame the GPU will cast out a ray and see if it hits an object.
//      1.  If _no_ object is hit, render a background colour
//      2.  If an object is hit, check if it can see any lights, if so draw a colour, if not, a shadow
//
// Beyond that we'll also look at casting more rays to do things like reflections, and refractions
// ## Contents
// 0. [Configuration](#configuration)
// 1. [HTML](#html)
// 2. [WebGL](#webgl)
// 3. [Application State](#state)
// 4. [Animation!](#animation)
//
// <a name="configuration"></a>
// ## 0. Configuration
//
// `g_floorPlaneSize` is an arbitrary boundary to our scene and describes
// sizing used to bound animations and define a "floor plane" on which we
// can see shadows
const g_floorPlaneSize = 25;
const g_scene = getScene();
const g_configShader = getShaderConfiguration(g_scene);
// 
// <a name="html"></a>
// ## 1. HTML
//
// We'll [setup the HTML](html.html "HTML Setup code")
//
const g_canvas = getHtmlCanvas();
//
// <a name="webgl"></a>
// ## 2. WebGL Initialization
//
// In order to upload things to the GPU and renderthem on the canvas we'll need to work
// with an API.  We can ask our canvas for a [WebGLRenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext "WebGL Rendering Context is the API we use to upload stuff to the GPU");
// which will be the API we use to upload stuff to the GPU.
const g_gl = g_canvas.getContext('webgl');
// The world is an imperfect place, let's make sure we got a valid context
throwIfFalsey(g_gl, 'could not get a WebGL context');
// Okay, great, so we've got a an API that let's us talk to the GPU.  Alone that's
// not enough for us to get started.  We need to give the GPU some code to run
// we're going to need at least one GLSL program, that code is [located in shaders.ts](shaders.html "Our shaders, the 'body' of our program")
const g_ctx = bindProgram(g_gl, getVertexSource(), getFragmentSource(g_configShader));
const g_uniforms = setupScene(g_gl, g_ctx, g_scene, g_configShader);
draw(g_gl, g_ctx, g_canvas);
//
// <a name="state"></a>
// ## 3. Application State
//
const g_planetStates = (function () {
    const states = [];
    for (let i = 0; i < g_scene.spheres.length; i += 1) {
        const p = g_scene.spheres[i].point;
        const x = (Math.random() - 0.5);
        const y = (Math.random() - 0.5);
        const z = (Math.random() - 0.5);
        states.push({
            matrix: translate4_4(identity4_4(), p[0], p[1], p[2]),
            vector: normalize3_1([x, y, z]),
        });
    }
    return states;
}());
const g_fps = {
    countTime: 0,
    lastTime: 0,
    frames: 0,
    sampleDuration: 5000,
};
const g_userControllableState = {
    shadingModel: 0,
    aa: 0,
    isAnimating: true,
};
//
// <a name="animate"></a>
// 4. ## Animate!
//
// start the animation by default
// on each frame...
const animate = (time) => {
    const { aa, isAnimating, shadingModel } = g_userControllableState;
    if (isAnimating === false) {
        return;
    }
    g_fps.frames += 1;
    g_fps.countTime += time - g_fps.lastTime;
    g_fps.lastTime = time;
    if (g_fps.countTime >= g_fps.sampleDuration) {
        console.log('fps', g_fps.frames / (g_fps.countTime / 1000));
        g_fps.frames = 0;
        g_fps.countTime = 0;
    }
    g_planetStates.forEach((state, i) => {
        if (i > 0) {
            if (state.matrix[12] > g_floorPlaneSize) {
                state.vector = normalize3_1([-1, state.vector[1], state.vector[2]]);
            }
            if (state.matrix[13] > 15) {
                state.vector = normalize3_1([state.vector[0], -1, state.vector[2]]);
            }
            if (state.matrix[14] > g_floorPlaneSize) {
                state.vector = normalize3_1([state.vector[0], state.vector[1], -1]);
            }
            if (state.matrix[12] < -g_floorPlaneSize) {
                state.vector = normalize3_1([1, state.vector[1], state.vector[2]]);
            }
            if (state.matrix[13] < 0.5) {
                state.vector = normalize3_1([state.vector[0], 1, state.vector[2]]);
            }
            if (state.matrix[14] < -g_floorPlaneSize) {
                state.vector = normalize3_1([state.vector[0], state.vector[1], 1]);
            }
            const speed = Math.random() * 3 + 5;
            const x = state.vector[0] / speed;
            const y = state.vector[1] / speed;
            const z = state.vector[2] / speed;
            state.matrix = translate4_4(state.matrix, x, y, z);
            // pin the second light to the second sphere
            if (i === 1) {
                g_scene.lights[1][0] = state.matrix[12];
                g_scene.lights[1][1] = state.matrix[13];
                g_scene.lights[1][2] = state.matrix[14];
                g_uniforms.pointLights[1].point(g_scene.lights[1]);
            }
        }
        const sphere = g_scene.spheres[i];
        if (i > 0) {
            sphere.point = [state.matrix[12], state.matrix[13], state.matrix[14]];
            g_planetStates[i] = state;
        }
        g_uniforms.spheres[i].point(sphere.point);
    });
    g_uniforms.shadingModel(shadingModel);
    g_uniforms.aa(aa);
    draw(g_gl, g_ctx, g_canvas);
    requestAnimationFrame(animate);
};
// bind some controls
bindInputControls(g_userControllableState);
// finally kick it all off
animate(0);
function createMatrix3_1() {
    return [0, 0, 0];
}
function identity3_3() {
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
}
function multiply3_1(a, b, op = createObjectPool(createMatrix3_1)) {
    const v = op.malloc();
    v[0] = a[1] * b[2] - a[2] * b[1];
    v[1] = a[2] * b[0] - a[0] * b[2];
    v[2] = a[0] * b[1] - a[1] * b[0];
    return v;
}
function multiply3_3(a, b) {
    const a00 = a[0 * 3 + 0];
    const a01 = a[0 * 3 + 1];
    const a02 = a[0 * 3 + 2];
    const a10 = a[1 * 3 + 0];
    const a11 = a[1 * 3 + 1];
    const a12 = a[1 * 3 + 2];
    const a20 = a[2 * 3 + 0];
    const a21 = a[2 * 3 + 1];
    const a22 = a[2 * 3 + 2];
    const b00 = b[0 * 3 + 0];
    const b01 = b[0 * 3 + 1];
    const b02 = b[0 * 3 + 2];
    const b10 = b[1 * 3 + 0];
    const b11 = b[1 * 3 + 1];
    const b12 = b[1 * 3 + 2];
    const b20 = b[2 * 3 + 0];
    const b21 = b[2 * 3 + 1];
    const b22 = b[2 * 3 + 2];
    return [
        b00 * a00 + b01 * a10 + b02 * a20,
        b00 * a01 + b01 * a11 + b02 * a21,
        b00 * a02 + b01 * a12 + b02 * a22,
        b10 * a00 + b11 * a10 + b12 * a20,
        b10 * a01 + b11 * a11 + b12 * a21,
        b10 * a02 + b11 * a12 + b12 * a22,
        b20 * a00 + b21 * a10 + b22 * a20,
        b20 * a01 + b21 * a11 + b22 * a21,
        b20 * a02 + b21 * a12 + b22 * a22,
    ];
}
function subtract3_1(a, b, op = createObjectPool(createMatrix3_1)) {
    const v = op.malloc();
    v[0] = a[0] - b[0];
    v[1] = a[1] - b[1];
    v[2] = a[2] - b[2];
    return v;
}
function normalize3_1(m, op = createObjectPool(createMatrix3_1)) {
    const v = op.malloc();
    const length = Math.sqrt(m[0] * m[0] + m[1] * m[1] + m[2] * m[2]);
    // make sure we don't divide by 0.
    if (length > 0.0000001) {
        v[0] = m[0] / length;
        v[1] = m[1] / length;
        v[2] = m[2] / length;
        return v;
    }
    console.warn('normalize3_1 has no length', m);
    v[0] = 0;
    v[1] = 0;
    v[2] = 0;
    return v;
}
function createTranslation3_3(tx, ty) {
    return [1, 0, 0, 0, 1, 0, tx, ty, 1];
}
function createRotation3_3(angleInRadians) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    return [c, -s, 0, s, c, 0, 0, 0, 1];
}
function createScaling3_3(sx, sy) {
    return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
}
function createProjection3_3(width, height) {
    // Note: This matrix flips the Y axis so that 0 is at the top.
    return [2 / width, 0, 0, 0, -2 / height, 0, -1, 1, 1];
}
function translate3_3(m, x, y) {
    return multiply3_3(createTranslation3_3(x, y), m);
}
function rotate3_3(m, angleInRadians) {
    return multiply3_3(createRotation3_3(angleInRadians), m);
}
function scale3_3(m, sx, sy) {
    return multiply3_3(createScaling3_3(sx, sy), m);
}
function project3_3(m, width, height) {
    return multiply3_3(createProjection3_3(width, height), m);
}
function createMatrix4_4() {
    return new Float32Array(16);
}
function copy4_4(source, op = createObjectPool(createMatrix4_4)) {
    const v = op.malloc();
    for (let i = 0; i < source.length; i += 1) {
        v[i] = source[i];
    }
    return v;
}
function identity4_4(op = createObjectPool(createMatrix4_4)) {
    const v = op.malloc();
    v[0] = 1;
    v[1] = 0;
    v[2] = 0;
    v[3] = 0;
    v[4] = 0;
    v[5] = 1;
    v[6] = 0;
    v[7] = 0;
    v[8] = 0;
    v[9] = 0;
    v[10] = 1;
    v[11] = 0;
    v[12] = 0;
    v[13] = 0;
    v[14] = 0;
    v[15] = 1;
    return v;
}
function multiply4_4and3_1(a, b, op = createObjectPool(createMatrix3_1)) {
    const m = op.malloc();
    m[0] = a[0] * b[0] + a[4] * b[1] + a[8] * b[2] + a[12];
    m[1] = a[1] * b[0] + a[5] * b[1] + a[9] * b[2] + a[13];
    m[2] = a[2] * b[0] + a[6] * b[1] + a[10] * b[2] + a[14];
    return m;
}
function multiply4_4(a, b, op = createObjectPool(createMatrix4_4)) {
    const v = op.malloc();
    const b00 = b[0 * 4 + 0];
    const b01 = b[0 * 4 + 1];
    const b02 = b[0 * 4 + 2];
    const b03 = b[0 * 4 + 3];
    const b10 = b[1 * 4 + 0];
    const b11 = b[1 * 4 + 1];
    const b12 = b[1 * 4 + 2];
    const b13 = b[1 * 4 + 3];
    const b20 = b[2 * 4 + 0];
    const b21 = b[2 * 4 + 1];
    const b22 = b[2 * 4 + 2];
    const b23 = b[2 * 4 + 3];
    const b30 = b[3 * 4 + 0];
    const b31 = b[3 * 4 + 1];
    const b32 = b[3 * 4 + 2];
    const b33 = b[3 * 4 + 3];
    const a00 = a[0 * 4 + 0];
    const a01 = a[0 * 4 + 1];
    const a02 = a[0 * 4 + 2];
    const a03 = a[0 * 4 + 3];
    const a10 = a[1 * 4 + 0];
    const a11 = a[1 * 4 + 1];
    const a12 = a[1 * 4 + 2];
    const a13 = a[1 * 4 + 3];
    const a20 = a[2 * 4 + 0];
    const a21 = a[2 * 4 + 1];
    const a22 = a[2 * 4 + 2];
    const a23 = a[2 * 4 + 3];
    const a30 = a[3 * 4 + 0];
    const a31 = a[3 * 4 + 1];
    const a32 = a[3 * 4 + 2];
    const a33 = a[3 * 4 + 3];
    v[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    v[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    v[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    v[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
    v[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    v[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    v[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    v[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
    v[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    v[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    v[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    v[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
    v[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    v[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    v[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    v[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
    return v;
}
function createTranslation4_4(x, y, z, op = createObjectPool(createMatrix4_4)) {
    const v = op.malloc();
    v[0] = 1;
    v[1] = 0;
    v[2] = 0;
    v[3] = 0;
    v[4] = 0;
    v[5] = 1;
    v[6] = 0;
    v[7] = 0;
    v[8] = 0;
    v[9] = 0;
    v[10] = 1;
    v[11] = 0;
    v[12] = x;
    v[13] = y;
    v[14] = z;
    v[15] = 1;
    return v;
}
function createXRotation4_4(angleInRadians, op = createObjectPool(createMatrix4_4)) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    const v = op.malloc();
    v[0] = 1;
    v[1] = 0;
    v[2] = 0;
    v[3] = 0;
    v[4] = 0;
    v[5] = c;
    v[6] = s;
    v[7] = 0;
    v[8] = 0;
    v[9] = -s;
    v[10] = c;
    v[11] = 0;
    v[12] = 0;
    v[13] = 0;
    v[14] = 0;
    v[15] = 1;
    return v;
}
function createYRotation4_4(angleInRadians, op = createObjectPool(createMatrix4_4)) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    const v = op.malloc();
    v[0] = c;
    v[1] = 0;
    v[2] = -s;
    v[3] = 0;
    v[4] = 0;
    v[5] = 1;
    v[6] = 0;
    v[7] = 0;
    v[8] = s;
    v[9] = 0;
    v[10] = c;
    v[11] = 0;
    v[12] = 0;
    v[13] = 0;
    v[14] = 0;
    v[15] = 1;
    return v;
}
function createZRotation4_4(angleInRadians, op = createObjectPool(createMatrix4_4)) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    const v = op.malloc();
    v[0] = c;
    v[1] = s;
    v[2] = 0;
    v[3] = 0;
    v[4] = -s;
    v[5] = c;
    v[6] = 0;
    v[7] = 0;
    v[8] = 0;
    v[9] = 0;
    v[10] = 1;
    v[11] = 0;
    v[12] = 0;
    v[13] = 0;
    v[14] = 0;
    v[15] = 1;
    return v;
}
function createScaling4_4(x, y, z, op = createObjectPool(createMatrix4_4)) {
    const v = op.malloc();
    v[0] = x;
    v[1] = 0;
    v[2] = 0;
    v[3] = 0;
    v[4] = 0;
    v[5] = y;
    v[6] = 0;
    v[7] = 0;
    v[8] = 0;
    v[9] = 0;
    v[10] = z;
    v[11] = 0;
    v[12] = 0;
    v[13] = 0;
    v[14] = 0;
    v[15] = 1;
    return v;
}
function translate4_4(m, x, y, z, op = createObjectPool(createMatrix4_4)) {
    const t = createTranslation4_4(x, y, z, op);
    const result = multiply4_4(m, t, op);
    op.free(t);
    return result;
}
function xRotate4_4(m, angleInRadians, op = createObjectPool(createMatrix4_4)) {
    const t = createXRotation4_4(angleInRadians, op);
    const result = multiply4_4(m, t, op);
    op.free(t);
    return result;
}
function yRotate4_4(m, angleInRadians, op = createObjectPool(createMatrix4_4)) {
    const t = createYRotation4_4(angleInRadians, op);
    const result = multiply4_4(m, t, op);
    op.free(t);
    return result;
}
function zRotate4_4(m, angleInRadians, op = createObjectPool(createMatrix4_4)) {
    const t = createZRotation4_4(angleInRadians, op);
    const result = multiply4_4(m, t, op);
    op.free(t);
    return result;
}
function scale4_4(m, x, y, z, op = createObjectPool(createMatrix4_4)) {
    const t = createScaling4_4(x, y, z, op);
    const result = multiply4_4(m, t, op);
    op.free(t);
    return result;
}
function ortho4_4(left, right, bottom, top, near, far, op = createObjectPool(createMatrix4_4)) {
    const v = op.malloc();
    v[0] = 2 / (right - left);
    v[1] = 0;
    v[2] = 0;
    v[3] = 0;
    v[4] = 0;
    v[5] = 2 / (top - bottom);
    v[6] = 0;
    v[7] = 0;
    v[8] = 0;
    v[9] = 0;
    v[10] = 2 / (near - far);
    v[11] = 0;
    v[12] = (left + right) / (left - right);
    v[13] = (bottom + top) / (bottom - top);
    v[14] = (near + far) / (near - far);
    v[15] = 1;
    return v;
}
function perspective4_4(fovRadians, aspect, near, far, op = createObjectPool(createMatrix4_4)) {
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fovRadians);
    const rangeInv = 1.0 / (near - far);
    const v = op.malloc();
    v[0] = f / aspect;
    v[1] = 0;
    v[2] = 0;
    v[3] = 0;
    v[4] = 0;
    v[5] = f;
    v[6] = 0;
    v[7] = 0;
    v[8] = 0;
    v[9] = 0;
    v[10] = (near + far) * rangeInv;
    v[11] = -1;
    v[12] = 0;
    v[13] = 0;
    v[14] = near * far * rangeInv * 2;
    v[15] = 0;
    return v;
}
function inverse4_4(m, op = createObjectPool(createMatrix4_4)) {
    const v = op.malloc();
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    const tmp_0 = m22 * m33;
    const tmp_1 = m32 * m23;
    const tmp_2 = m12 * m33;
    const tmp_3 = m32 * m13;
    const tmp_4 = m12 * m23;
    const tmp_5 = m22 * m13;
    const tmp_6 = m02 * m33;
    const tmp_7 = m32 * m03;
    const tmp_8 = m02 * m23;
    const tmp_9 = m22 * m03;
    const tmp_10 = m02 * m13;
    const tmp_11 = m12 * m03;
    const tmp_12 = m20 * m31;
    const tmp_13 = m30 * m21;
    const tmp_14 = m10 * m31;
    const tmp_15 = m30 * m11;
    const tmp_16 = m10 * m21;
    const tmp_17 = m20 * m11;
    const tmp_18 = m00 * m31;
    const tmp_19 = m30 * m01;
    const tmp_20 = m00 * m21;
    const tmp_21 = m20 * m01;
    const tmp_22 = m00 * m11;
    const tmp_23 = m10 * m01;
    const t0 = tmp_0 * m11 +
        tmp_3 * m21 +
        tmp_4 * m31 -
        (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    const t1 = tmp_1 * m01 +
        tmp_6 * m21 +
        tmp_9 * m31 -
        (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    const t2 = tmp_2 * m01 +
        tmp_7 * m11 +
        tmp_10 * m31 -
        (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    const t3 = tmp_5 * m01 +
        tmp_8 * m11 +
        tmp_11 * m21 -
        (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);
    const det = m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3;
    if (det === 0) {
        console.warn('4x4 Matrix inversion warnining, no inverse');
    }
    const d = det !== 0 ? 1.0 / det : 0.000000001;
    v[0] = d * t0;
    v[1] = d * t1;
    v[2] = d * t2;
    v[3] = d * t3;
    v[4] =
        d *
            (tmp_1 * m10 +
                tmp_2 * m20 +
                tmp_5 * m30 -
                (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
    v[5] =
        d *
            (tmp_0 * m00 +
                tmp_7 * m20 +
                tmp_8 * m30 -
                (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
    v[6] =
        d *
            (tmp_3 * m00 +
                tmp_6 * m10 +
                tmp_11 * m30 -
                (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
    v[7] =
        d *
            (tmp_4 * m00 +
                tmp_9 * m10 +
                tmp_10 * m20 -
                (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
    v[8] =
        d *
            (tmp_12 * m13 +
                tmp_15 * m23 +
                tmp_16 * m33 -
                (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
    v[9] =
        d *
            (tmp_13 * m03 +
                tmp_18 * m23 +
                tmp_21 * m33 -
                (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
    v[10] =
        d *
            (tmp_14 * m03 +
                tmp_19 * m13 +
                tmp_22 * m33 -
                (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
    v[11] =
        d *
            (tmp_17 * m03 +
                tmp_20 * m13 +
                tmp_23 * m23 -
                (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
    v[12] =
        d *
            (tmp_14 * m22 +
                tmp_17 * m32 +
                tmp_13 * m12 -
                (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
    v[13] =
        d *
            (tmp_20 * m32 +
                tmp_12 * m02 +
                tmp_19 * m22 -
                (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
    v[14] =
        d *
            (tmp_18 * m12 +
                tmp_23 * m32 +
                tmp_15 * m02 -
                (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
    v[15] =
        d *
            (tmp_22 * m22 +
                tmp_16 * m02 +
                tmp_21 * m12 -
                (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));
    return v;
}
function lookAt4_4(cameraPosition, target, up, op4_4 = createObjectPool(createMatrix4_4), op3_1 = createObjectPool(createMatrix3_1)) {
    const z1 = subtract3_1(cameraPosition, target, op3_1);
    const z = normalize3_1(z1, op3_1);
    const x1 = multiply3_1(up, z, op3_1);
    const x = normalize3_1(x1, op3_1);
    const y1 = multiply3_1(z, x, op3_1);
    const y = normalize3_1(y1, op3_1);
    const v = op4_4.malloc();
    v[0] = x[0];
    v[1] = x[1];
    v[2] = x[2];
    v[3] = 0;
    v[4] = y[0];
    v[5] = y[1];
    v[6] = y[2];
    v[7] = 0;
    v[8] = z[0];
    v[9] = z[1];
    v[10] = z[2];
    v[11] = 0;
    v[12] = cameraPosition[0];
    v[13] = cameraPosition[1];
    v[14] = cameraPosition[2];
    v[15] = 1;
    op3_1.free(x1);
    op3_1.free(x);
    op3_1.free(y1);
    op3_1.free(y);
    op3_1.free(z1);
    op3_1.free(z);
    return v;
}
function transpose4_4(m, op = createObjectPool(createMatrix4_4)) {
    const v = op.malloc();
    v[0] = m[0];
    v[1] = m[4];
    v[2] = m[8];
    v[3] = m[12];
    v[4] = m[1];
    v[5] = m[5];
    v[6] = m[9];
    v[7] = m[13];
    v[8] = m[2];
    v[9] = m[6];
    v[10] = m[10];
    v[11] = m[14];
    v[12] = m[3];
    v[13] = m[7];
    v[14] = m[11];
    v[15] = m[15];
    return v;
}
function vectorMultiply(v, m) {
    const dst = [];
    for (let i = 0; i < 4; ++i) {
        dst[i] = 0.0;
        for (let j = 0; j < 4; ++j) {
            dst[i] += v[j] * m[j * 4 + i];
        }
    }
    return dst;
}
function createObjectPool(create, initialSize = 0) {
    const pool = [];
    if (initialSize) {
        for (let i = 0; i < initialSize; i += 1) {
            pool.push(create());
        }
    }
    return {
        free(obj) {
            pool.push(obj);
        },
        malloc() {
            if (pool.length) {
                const o = pool.pop();
                if (o) {
                    return o;
                }
                return create();
            }
            return create();
        },
    };
}
function getScene(sphereCount = 57, minOrbit = 3) {
    // Our scene is going to be a proof of concept, can we render a bunch of simple
    // objects at reasonable speed. Mathematical spheres are some of the simplest
    // objects to render and store.
    //
    // ### Setup The Scene Dependencies
    //
    // we don't have a sophisticated geometry system.  We'll be generating
    // that here in a sub optimal way for a real app.
    //
    // Starting with a means of computing a triangle's normal
    // triangles.map((t, i) => {
    const triangleToNormal = (t) => {
        const v0v1 = subtract3_1(t.points[1], t.points[0]);
        const v0v2 = subtract3_1(t.points[2], t.points[0]);
        const normal = normalize3_1(multiply3_1(v0v1, v0v2));
        return normal;
    };
    // we'll need a place to cache triangle normals
    let triangleNormals = [];
    //
    // <a name="spheres"></a>
    // #### Build the Spheres
    //
    // We'll have one large static sphere in the centre and many other spheres
    // that we'll animate around the scene
    const spheres = (function () {
        // we'll also need to store the spheres somewhere
        const s = [];
        // we'll initialize the spheres so they're not immediately overlapping
        // in order to do that we'll increment the radius for each sphere we add
        // to the scene
        let prevRadius = 0;
        // ##### Build a each sphere
        for (let i = 0; i < sphereCount; i += 1) {
            let radius = 0.1;
            let material = Math.floor(Math.random() * 5 + 2);
            // make the first circle large
            // make the second circle tiny
            // make all the rest randomly modest
            if (i === 0) {
                radius = minOrbit - 1;
            }
            else if (i === 1) {
                radius = 0.05;
                material = 1;
            }
            else {
                radius = (Math.random() / 2) + 0.1;
            }
            // build a simple sphere object
            s.push({
                radius,
                point: [
                    // we'll start the spheres on the x axis
                    i === 0
                        // the first sphere will be a the origin
                        ? 0
                        // the other spheres will fan out along the x axis
                        : minOrbit + i * 0.25 + radius + prevRadius,
                    // all sphere's we'll be
                    5, 0
                ],
                // each sphere has a "pointer" to a `material`
                // the "pointer" is an index in the `scene.materials` array
                material,
            });
            // update the radius for the next sphere
            prevRadius = radius;
        }
        // ##### We now have some spheres!
        return s;
    }());
    //
    // <a name="triangles"></a>
    // #### Triangles
    //
    // Triangles and ray intersections are harder to calculate than sphere intersections
    // we'll be focusing more on triangles later.  Right now we have some just to demonstrate
    // shadows
    //
    // Our scene has two triangles that make up the "floor plane" or our scene
    //
    // each triangle has a "pointer" to a `material`
    // the "pointer" is an index in the `scene.materials` array
    //
    // each triangle also has three points
    const triangles = [
        {
            material: 0,
            points: [
                [g_floorPlaneSize, 0, -g_floorPlaneSize],
                [-g_floorPlaneSize, 0, -g_floorPlaneSize],
                [-g_floorPlaneSize, 0, g_floorPlaneSize],
            ],
        },
        {
            material: 0,
            points: [
                [-g_floorPlaneSize, 0, g_floorPlaneSize],
                [g_floorPlaneSize, 0, g_floorPlaneSize],
                [g_floorPlaneSize, 0, -g_floorPlaneSize],
            ],
        },
    ];
    // now that we have some triangles, let's pre-compute the normals
    triangleNormals = triangles.map(triangleToNormal);
    //
    // <a name="materials"></a>
    // #### Materials
    //
    // materials are currently a bit of a mess.  The objects do double duty in both
    // the Blinn Phong (BP) model and in the PBR model
    //
    // * `colour` means "diffuse colour" in BP, and  "albedo" in PBR
    // * `ambient` means "% ambient contribution" in BP, and "ao" in PBR 
    // * `diffuse` means "% diffuse contribution" in BP, and "roughness" in PBR
    // * `specular` means "% specular contribution" in BP, and "metallic" in PBR
    // * `refraction` (future)
    // * `isTranslucent` (future)
    const materials = [
        // we'll hard code these ones in some places
        {
            colour: [200, 200, 200],
            ambient: 0.1,
            diffuse: 0.8,
            specular: 0.02,
            refraction: 1.0,
            isTranslucent: false,
        },
        {
            colour: [255, 255, 150],
            ambient: 0.1,
            diffuse: 0.999999,
            specular: 0.99999,
            refraction: 1.0,
            isTranslucent: true,
        },
        // the rest of these we'll pick from randomly
        {
            colour: [100, 0, 0],
            ambient: 0.01,
            diffuse: 0.5,
            specular: 0.1,
            refraction: 1.0,
            isTranslucent: false,
        },
        {
            colour: [150, 0, 150],
            ambient: 0.01,
            diffuse: 0.5,
            specular: 0.1,
            refraction: 1.0,
            isTranslucent: false,
        },
        {
            colour: [0, 150, 50],
            ambient: 0.01,
            diffuse: 0.5,
            specular: 0.1,
            refraction: 1.0,
            isTranslucent: false,
        },
        {
            colour: [10, 10, 200],
            ambient: 0.01,
            diffuse: 0.5,
            specular: 0.1,
            refraction: 1.0,
            isTranslucent: false,
        },
        {
            colour: [50, 50, 50],
            ambient: 0.2,
            diffuse: 0.01,
            specular: 0.999,
            refraction: 1.0,
            isTranslucent: false,
        },
    ];
    //
    // <a name="scene"></a>
    // ### The Actual Scene Object
    return {
        // let's build a camera
        camera: {
            point: [0, 5, 50],
            fieldOfView: 45,
            rotation: [0, 0, 0],
            up: [0, 1, 0],
        },
        // in the BlinnPhong model we'll have a hard coded ambient lighting intensity
        globalAmbientIntensity: 0.002,
        // for simplicity our lights are just a single point in space
        lights: [[-25, 30, 10], [0, 3, 0]],
        // place the materials object in the scene
        materials,
        // place the spheres object in the scene
        spheres,
        // place the triangles object in the scene
        triangles,
        // we'll calculate normals on the fly
        // and provide a mechanism for consumers that allows them to run a function on each
        // triangle, thereby they can be sure their loops iterate over all the triangles only
        // once
        triangleNormals(onEach, useCache = false) {
            if (useCache) {
                triangles.forEach((triangle, i) => onEach(triangleNormals[i], triangle, i));
                return triangleNormals;
            }
            triangleNormals = triangles.map((t, i) => {
                const normal = triangleToNormal(t);
                onEach(normal, t, i);
                return normal;
            });
            return triangleNormals;
        }
    };
}
// ## Shader Configuration
//
function getShaderConfiguration(scene) {
    // We'll put all of our configuration into an object
    // because much of our configuration is directly injected into GLSL code
    // and because WebGL's GLSL is ancient we're encoding our numbers as strings.
    // We're doing this to stop WebGL from complaining that `1` is not a float
    // this version of GLSL will want a full `1.0`
    return {
        // The colour of the background (if rays hit nothing this is the colour of the pixel) 
        bg: {
            r: '0.05',
            g: '0.05',
            b: '0.05',
        },
        // F0 is a setting in our PBR (physics based rendering) system that
        // deals with reflections in Fresnel equations
        defaultF0: '0.04',
        // Our shaders work with floating points.  Floating points have tiny decimals at
        // the ends which can make comparisions tricky.  `epsilon` gives us a small value
        // we can use to help work around some of the even smaller decimals.
        epsilon: '0.00005',
        // how many lights are in the scene?
        lightCount: scene.lights.length,
        // how many materials are in the scene?
        materialCount: scene.materials.length,
        // phongSpecular is a variable in our Blinn Phong (old school) system
        // that helps us control specular (shiny) lighting
        // it's a string
        phongSpecularExp: '32.0',
        // how many spheres are in the scene?
        sphereCount: scene.spheres.length,
        // how many triangles are in the scene?
        triangleCount: scene.triangles.length,
    };
}
// ## Shader
// Shaders are programs that run on the GPU.  In OpenGL and specifically WebGL
// there are two different programs that work together.  There's a vertex shader
// and there's a fragment shader.  They're both part of a _rasterization_ pipeline
//
// we're not rasterizing (much).
//
// Instead of rasterizing 3D objects as OpenGL intended, we'll be rasterizing a
// rectangle the size of our view 😂
//
// Normally in OpenGL we'd run a _vertex_ shader on each point in a triangle, and for each
// _fragment_ (pixel) in the triangle, we'd run a _fragment_ shader to compute the colour.
//
// * Our vertex shader will essentially do "nothing", and we can not think about it too much
// * Our fragment shader will run on each pixel and is essentially the "body" of this application
//
// For more information on [shaders checkout WebGL Fundamentals](https://webglfundamentals.org/ "Deeply learn about shaders")
//
// <a name="vertexShader"></a>
// ### Vertex Shader
//
// Our vertex shader code is a simple string
function getVertexSource() {
    return `` +
        // Vertex shaders can take two types of input
        // * `attribute`s
        // *  uniforms`
        //
        // In this app we can effectively ignore the vertex shader and we won't be binding
        // and uniforms to it
        //
        // The only attributes we'll use are the 3 points of each of the 2 triangles
        // that make up our rectangle
        `
    attribute vec4 a_position; ` +
        // our main function in this version of GLSL has one obligation and that is to set
        // `gl_Position` to some value.  `gl_Position` is a `vec4` x/y/z/w
        `    void main() {
       gl_Position = a_position;
    }
`;
}
//
// <a name="fragmentShader"></a>
// ### Fragment Shader
//
// The fragment shader is the body of our application it figures out what colour to make
// each pixel
function getFragmentSource(config) {
    // for brevity's sake break out the config values
    const { bg, defaultF0, epsilon, lightCount, materialCount, phongSpecularExp, sphereCount, triangleCount, } = config;
    // Then we'll get into the source
    // we start by telling WebGL what level of precision we require with floats
    // we could probably get away with highp but mediump is more universally supported
    return `precision mediump float; ` +
        // Every pixel needs to create at least one ray
        // `Ray`s are just `point`s x/y/z with a direction (`vector`), also x/y/z
        // `ior` is the "Index of Refraction" in the volume the ray was cast
        `    
    struct Ray {
        vec3 point;
        vec3 vector;
        float ior;
    };
` +
        // `Material`s are a bit of a mess, their "shape" is shared between
        // JavaScript and GLSL, full descriptions of shape can be found in
        // [the js scene docs](scene.html#materials)
        `    
    struct Material {
        vec3 colourOrAlbedo;
        float ambient;
        float diffuseOrRoughness;
        float specularOrMetallic;
        float refraction;
        int isTranslucent;
    };
` +
        // `Hit`s describe the intersection of a `Ray` and an object
        `    
    struct Hit {
        float distance;
        Material material;
        vec3 normal;
        vec3 position;
        Ray ray;
    };
` +
        // `Sphere`s in our case are mathematical spheres
        // They are a simple point, a radius, and a pointer to an element in the `materials`
        // array
        `    
    struct Sphere {
        vec3 point;
        float radius;
        int material;
    };
` +
        // `SphereDistance` lets us return a `Sphere` and how far we are from it
        `    
    struct SphereDistance {
        float distance;
        Sphere sphere;
    };
` +
        // `Triangle`s share a "shape" with JavaScript and are [documented here](scene.html#triangles)
        `   
    struct Triangle {
        vec3 a;
        vec3 b;
        vec3 c;
        vec3 normal;
        int material;
    };
` +
        // `TriangleDistance` lets us return a `Triangle`, how far we are from it, the
        // point at which our ray intersected the triangle, and "barycentric" coordinates
        // `u` and `v` for future texturing
        `    
    struct TriangleDistance {
        float distance;
        Triangle triangle;
        vec3 intersectPoint;
        float u;
        float v;
    };
` +
        // `PointLight` is a wrapper around a `point`, lights will have colours in the future
        `
    struct PointLight {
        vec3 point;
    };
` +
        // we have a few constants, `bg`, the background colour is configurable
        `
    const vec3 bgColour = vec3(${bg.r}, ${bg.g}, ${bg.b});
    const float PI = ${Math.PI};
    const float refractionMedium = 1.0;
` +
        // uniforms are values uploaded by javascript, there are a few essentialls here
        `
    uniform float aspectRatio;
    uniform vec3 cameraPos;
    uniform mat4 cameraMatrix;
    uniform float globalAmbientIntensity;
    uniform float height;
    uniform float scale;
    uniform float width;
` +
        // For now we'll also use some uniforms to select rending options
        // in a performant app we'd want to dnyamically generate faster shaders
        // that can skip this check and have the models baked in
        //
        // for now let's set them up here
        //
        // 0 for Blinn Phong, 1 for PBR
        `
    uniform int shadingModel;
` +
        // anti-aliasing amount 0 - none, 2 - some, 4, reasonable but 4x the work
        `
    uniform int aa;
` +
        // we have a few "look up" tables here
        // GLSL arrays in this version aren't so much random access chunks of memory
        // as they are "fixed access" chunks of memory.  GLSL wants to know up front
        // exactly how much space to use.
        //
        // _Additionally_ outside of loops we are _not allowed_ to reference arrays 
        // with variables.  This is a seemingly severe limitation but we can hack
        // around it
        //
        //
        `
    uniform Material materials[${materialCount}];
    uniform Sphere spheres[${sphereCount}];
    uniform PointLight pointLights[${lightCount}];
    uniform Triangle triangles[${triangleCount}];
` +
        // in GLSL if you want to call your functions "out of the order their written" you'll
        // need to declare them upfront
        `
    float sphereIntersection(Sphere sphere, Ray ray);
    TriangleDistance triangleIntersection(Triangle triangle, Ray ray);
    SphereDistance intersectSpheres(Ray ray, bool useAnyHit);
    TriangleDistance intersectTriangles(Ray ray, bool useAnyHit);
    vec3 cast1(Ray ray);
    vec3 cast2(Ray ray);
    vec3 cast3(Ray ray);
    vec3 sphereNormal(Sphere sphere, vec3 pos);
    vec3 surfacePhong(Hit hit);
    vec3 surfacePbr1(Hit hit);
    vec3 surfacePbr2(Hit hit);
    bool isLightVisible(vec3 pt, vec3 light, vec3 normal);
    bool areEqualish(float a, float b);
    vec3 primaryRay(float xo, float yo);
    float DistributionGGX(vec3 N, vec3 H, float roughness);
    float GeometrySchlickGGX(float NdotV, float roughness);
    float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness);
    vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness);
    Material getMaterial(int index);
` +
        //
        // <a name="fragmentMain"></a>
        // #### Fragment Main
        //
        // Like the vector shader, the fragment shader also has to have a main function
        // in the fragment shader, our requirement is to set `gl_FragColor`.  `gl_FragColor` is
        // a `vec4` r/g/b/a
        `    void main() {
` +
        // we'll support casting 2, 4, or 1 rays from the camera to _this_ pixel
        // the more rays the better the anti-aliasing.  That said these values literally
        // multiply the cost of the function per pixel, so 4xAA 1080P mean `1920 * 1080 * 4`
        // primary rays!
        `
        vec3 total = vec3(0.0);
` +
        // we need to average the colours at the end of this, and we'll use this divisor to do it
        `
        float divisor = 1.0;

        if (aa == 2) {
            divisor = 2.0;
            total += primaryRay(0.25, 0.25).rgb;
            total += primaryRay(0.75, 0.75).rgb;
        } else if (aa == 4) {
            divisor = 4.0;
            total += primaryRay(0.25, 0.25).rgb;
            total += primaryRay(0.75, 0.25).rgb;
            total += primaryRay(0.75, 0.75).rgb;
            total += primaryRay(0.25, 0.75).rgb;
        } else {
            total += primaryRay(0.5, 0.5).rgb;
        }

` +
        // finally we set `gl_FragColor`, averaging the rays we cast
        // we hard code the alpha value to `1.0` as we'll be doing
        // translucency differently
        `
        gl_FragColor = vec4(total.rgb / divisor, 1.0);
    }
` +
        //
        // <a name="primaryRay"></a>
        // #### primaryRay
        //
        // the primaryRay function computes the primary ray from the pinhole camera location
        // to the _portion of the pixel_ specified by `xo` and `yo`
        `
    vec3 primaryRay(float xo, float yo) {
        float px = gl_FragCoord.x;
        float py = gl_FragCoord.y;

        float x = (2.0 * (px + xo) / width - 1.0) * scale;
        float y = (2.0 * (py + yo) / height - 1.0) * scale * 1.0 / aspectRatio;

        vec3 dir = vec3(0.0, 0.0, 0.0);

        dir.x = x    * cameraMatrix[0][0] + y * cameraMatrix[1][0] + -1.0 * cameraMatrix[2][0];
        dir.y = y    * cameraMatrix[0][1] + y * cameraMatrix[1][1] + -1.0 * cameraMatrix[2][1];
        dir.z = -1.0 * cameraMatrix[0][2] + y * cameraMatrix[1][2] + -1.0 * cameraMatrix[2][2];

        Ray ray = Ray(cameraPos, normalize(dir), refractionMedium);

        return cast1(ray);
    }
` +
        //
        // <a name="trace"></a>
        // #### trace
        //
        // the trace function checks if a ray intersects _any_ spheres _or_ triangles
        // in the scene.  In the future it's ripe for "acceleration"
        `
    Hit trace(Ray ray) {
       SphereDistance sd = intersectSpheres(ray, false);
       TriangleDistance td = intersectTriangles(ray, false);
       if (sd.distance <= 0.0 && td.distance <= 0.0) {
           return Hit(
               -1.0,
               Material(vec3(0.0, 0.0, 0.0), 0.0, 0.0, 0.0, 0.0, 0),
               vec3(0.0, 0.0, 0.0),
               vec3(0.0, 0.0, 0.0),
               ray
           );
       }

       if (sd.distance >= 0.0 && td.distance >= 0.0) {
           if (sd.distance < td.distance) {
            vec3 pointAtTime = ray.point + vec3(ray.vector.xyz * sd.distance);
            vec3 normal = sphereNormal(sd.sphere, pointAtTime);

            return Hit(
                sd.distance,
                getMaterial(sd.sphere.material),
                normal,
                sd.sphere.point,
                ray
            );
           } else {
            return Hit(
                td.distance,
                getMaterial(td.triangle.material),
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
            getMaterial(sd.sphere.material),
            normal,
            sd.sphere.point,
            ray
        );
       }

       return Hit(
            td.distance,
            getMaterial(td.triangle.material),
            td.triangle.normal,
            td.intersectPoint,
            ray
        );
    }
` +
        // the `castX` functions cast rays and call a surface function to
        // get the colour
        //
        // right now they're a mess in that they are being hard code toggled
        // to produce results
        `
    vec3 cast1(Ray ray) {
        Hit hit = trace(ray);

        if (hit.distance < 0.0) {
            return bgColour;
        }

        if (shadingModel == 0) {
            return surfacePbr1(hit);
        } else {
            return surfacePhong(hit);
        }
    }

    vec3 cast2(Ray ray) {
        Hit hit = trace(ray);

        if (hit.distance < 0.0) {
            return bgColour;
        }

        if (shadingModel == 0) {
            return surfacePbr2(hit);
        } else {
            return surfacePhong(hit);
        }
    }

    vec3 cast3(Ray ray) {
        Hit hit = trace(ray);

        if (hit.distance < 0.0) {
            return bgColour;
        }

        return surfacePhong(hit);
    }
` +
        // compute the normal of a sphere
        `
    vec3 sphereNormal(Sphere sphere, vec3 pos) {
        return normalize(pos - sphere.point);
    }
` +
        // ray spehre intersection iterator
        `

    SphereDistance intersectSpheres(Ray ray, bool useAnyHit) {
        SphereDistance sd = SphereDistance(-1.0, Sphere(
            vec3(0.0, 0.0, 0.0), 
            -1.0,
            0));
        for (int i = 0; i < ${sphereCount}; i += 1) {
            Sphere s = spheres[i];
            float dist = sphereIntersection(s, ray);
            if (dist >= 0.0) {
                // we're temporarily hacking in an object that casts no shadow 
                Material m = getMaterial(sd.sphere.material);
                if (sd.distance <= 0.0 || dist < sd.distance) {
                    if (useAnyHit == false || m.isTranslucent == 0) {
                        sd.distance = dist;
                        sd.sphere = s;
                    }
                }
                if (useAnyHit) {
                    // we're temporarily hacking in an object that casts no shadow 
                    if (m.isTranslucent != 0) {
                        sd.distance = dist;
                        sd.sphere = s;
                        return sd;
                    }
                }
            }
        }
        return sd;
    }
` +
        // Ray triangle intersection iterator
        `
    TriangleDistance intersectTriangles(Ray ray, bool useAnyHit) {
        TriangleDistance least = TriangleDistance(
            -1.0, 
            Triangle(
                vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.0), 
                vec3(0.0, 0.0, 0.0), 
                0),
            vec3(0.0, 0.0, 0.0),
            0.0,
            0.0);

        for (int i = 0; i < ${triangleCount}; i += 1) {
            Triangle t = triangles[i];
            TriangleDistance td = triangleIntersection(t, ray);
            if (td.distance >= 0.0) {
                // we're temporarily hacking in an object that casts no shadow 
                Material m = getMaterial(td.triangle.material);
                if (least.distance <= 0.0 || td.distance < least.distance) {
                    if (useAnyHit == false || m.isTranslucent == 0) {
                        least = td;
                    }
                }
                if (useAnyHit == true) {
                    // we're temporarily hacking in an object that casts no shadow 
                    if (m.isTranslucent != 0) {
                        return td;
                    }
                }
            }
        }
        return least;
    }
` +
        // calculate the intersection of a ray and a triangle
        `
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
` +
        // is there a light visible from a point? (shadows)
        `
    bool isLightVisible(vec3 pt, vec3 light, vec3 normal) {
        vec3 unit = normalize(light - pt);
        Ray ray = Ray(pt + vec3(normal.xyz + ${epsilon}), unit, refractionMedium);
        SphereDistance sd = intersectSpheres(ray, true);

        if (sd.distance > 0.0) {
            return false;
        }

        TriangleDistance td = intersectTriangles(ray, true);

        return td.distance < 0.0;
    }
` +
        // colour space conversion functions
        `
    float sRgb8ChannelToLinear(float colour8) {
        const float sThresh = 0.04045;

        float colourf = colour8 / 255.0;
        if (colourf <= sThresh) {
            return colourf / 12.92;
        }

        return pow((colourf + 0.055) / 1.055, 2.4);
    }

    vec3 sRgb8ToLinear(vec3 srgb8) {
        return vec3(
            sRgb8ChannelToLinear(srgb8.r),
            sRgb8ChannelToLinear(srgb8.g),
            sRgb8ChannelToLinear(srgb8.b)
            );
    }

    float linearChannelToSrgbF(float linear) {
        if (linear <= 0.0031308) {
            return (linear * 12.92);
        }

        return (1.055 * pow(linear, 1.0/2.4) - 0.055);
    }

    vec3 linearToSrgbF(vec3 linear) {
        return vec3(
            linearChannelToSrgbF(linear.r),
            linearChannelToSrgbF(linear.g),
            linearChannelToSrgbF(linear.b)
        );
    }

` +
        // the bulk of the PBR loop
        `
    vec3 surfacePbrReflectance(Hit hit, vec3 N, vec3 V, vec3 R, vec3 reflectColour, vec3 refractColour) {
        Material material = hit.material;
        vec3 albedo = sRgb8ToLinear(material.colourOrAlbedo); // pow(material.colourOrAlbedo.rgb, vec3(2.2));
        float ao = material.ambient;
        float metallic = material.specularOrMetallic;
        float roughness = material.diffuseOrRoughness;

        vec3 F0 = vec3(${defaultF0}); 
        F0 = mix(F0, albedo, metallic);

        // reflectance equation
        bool didLight = false;
        vec3 Lo = vec3(0.0);
        for (int i = 0; i < ${lightCount}; i += 1) {
            if (isLightVisible(hit.position, pointLights[i].point, hit.normal) == true) {
                didLight = true;
                // calculate per-light radiance
                vec3 lightDir = pointLights[i].point - hit.position;
                float distance = length(lightDir);
                vec3 L = normalize(lightDir);
                vec3 H = normalize(V + L);
                float attenuation = 1.0 / (distance * distance);
                // @todo light colour
                vec3 lightColour = sRgb8ToLinear(vec3(255.0, 255.0, 255.0) * 35.0);
                vec3 radiance = lightColour.rgb * attenuation;

                // Cook-Torrance BRDF
                float NDF = DistributionGGX(N, H, roughness);   
                float G   = GeometrySmith(N, V, L, roughness);      
                vec3 F    = fresnelSchlickRoughness(max(dot(H, V), 0.0), F0, roughness);

                vec3 nominator    = NDF * G * F; 
                float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.001; // 0.001 to prevent divide by zero.
                /** @todo use real physics, this violates the PBR to some extent */
                vec3 specular = nominator / denominator + F * reflectColour * metallic;

                // kS is equal to Fresnel
                vec3 kS = F;
                // for energy conservation, the diffuse and specular light can't
                // be above 1.0 (unless the surface emits light); to preserve this
                // relationship the diffuse component (kD) should equal 1.0 - kS.
                vec3 kD = vec3(1.0) - kS;
                // multiply kD by the inverse metalness such that only non-metals 
                // have diffuse lighting, or a linear blend if partly metal (pure metals
                // have no diffuse light).
                kD *= 1.0 - metallic;	  
                // scale light by NdotL
                float NdotL = max(dot(N, L), 0.0);        

                // add to outgoing radiance Lo
                Lo += (kD * (albedo + refractColour) / PI + specular) * radiance * NdotL;  // note that we already multiplied the BRDF by the Fresnel (kS) so we won't multiply by kS again
            }
        }

        if (didLight == false) {
            return vec3(0.0, 0.0, 0.0);
        }

        // ambient lighting (will replace this ambient lighting with 
        // environment lighting).
        vec3 ambient = vec3(0.03) * albedo * ao;
    
        vec3 colour = ambient + Lo;


        // HDR tonemapping
        colour = colour / (colour + vec3(1.0));

        colour = linearToSrgbF(colour);

        return colour;
    }
` +
        // PBR Surface functions
        `
    vec3 surfacePbr1(Hit hit) {
        vec3 N = hit.normal;
        vec3 V = normalize(hit.ray.point - hit.position);
        vec3 R = reflect(-V, N);  
        vec3 reflectColour = cast2(Ray(hit.position, R, hit.ray.ior)).rgb;
        vec3 refractColour = vec3(0.0, 0.0, 0.0);

        if (hit.material.isTranslucent == 1) {
            if (areEqualish(hit.ray.ior, hit.material.refraction) == false) {
            }
        }

        return surfacePbrReflectance(hit, N, V, R, reflectColour, refractColour);
    }

    vec3 surfacePbr2(Hit hit) {
        vec3 N = hit.normal;
        vec3 V = normalize(hit.ray.point - hit.position);
        vec3 R = reflect(-V, N);   

        return surfacePbrReflectance(hit, N, V, R, vec3(1.0, 1.0, 1.0), vec3(0.0, 0.0, 0.0));
    }
` +
        // Blinn Phong functions
        `
    vec3 surfacePhong(Hit hit) {
        Material material = hit.material;
        vec3 fullColour = vec3(material.colourOrAlbedo.rgb / 255.0);
        vec3 diffuse = vec3(0.0, 0.0, 0.0);
        vec3 specular = vec3(0.0, 0.0, 0.0);

        for (int i = 0; i < ${lightCount}; i += 1) {
            if (isLightVisible(hit.position, pointLights[i].point, hit.normal) == true) {
                // @todo light colour
                vec3 lightColour = vec3(1.0, 1.0, 1.0);
                vec3 lightDir = normalize(pointLights[i].point - hit.position);
                float lightIntensity = 1.0;

                // diffuse
                float dco = dot(hit.normal, lightDir);
                if (dco < 0.0) { dco = 0.0; }

                diffuse += vec3(fullColour.rgb * lightIntensity * dco);

                // specular
                vec3 halfway = normalize(lightDir - hit.ray.vector);
                float sco = dot(hit.normal, normalize(halfway));
                if (sco < 0.0) { sco = 0.0; }
                
                specular += vec3(lightColour.rgb * lightIntensity * pow(sco, ${phongSpecularExp}));
            }
        }

        // calculate ambient light
        vec3 ambient = vec3(fullColour.rgb * globalAmbientIntensity);
        ambient = vec3(ambient.rgb + (fullColour.rgb * material.ambient));

        return ambient.rgb + diffuse.rgb * material.diffuseOrRoughness + specular.rgb * material.specularOrMetallic;
    }
` +
        // are two floating points roughly equal?
        `
    bool areEqualish(float a, float b) {
        if (abs(a - b) < ${epsilon}) {
            return true;
        }
        return false;
    }
` +
        // hack around GLSL's inability to index arrays
        `
    Material getMaterial(int index) {
        if (index == 0) {
            return materials[0];
        }

        if (index == 1) {
            return materials[1];
        }

        if (index == 2) {
            return materials[2];
        }

        if (index == 3) {
            return materials[3];
        }

        if (index == 4) {
            return materials[4];
        }

        if (index == 5) {
            return materials[5];
        }

        if (index == 6) {
            return materials[6];
        }

        return materials[0];
    }
` +
        // PBR Computations
        // essentially straight from [Learn OpenGL](https://learnopengl.com/PBR/Theory "Learn OpenGL`")
        `
// ----------------------------------------------------------------------------
    float DistributionGGX(vec3 N, vec3 H, float roughness) {
        float a = roughness*roughness;
        float a2 = a*a;
        float NdotH = max(dot(N, H), 0.0);
        float NdotH2 = NdotH*NdotH;

        float nom   = a2;
        float denom = (NdotH2 * (a2 - 1.0) + 1.0);
        denom = PI * denom * denom;

        return nom / denom;
    }
// ----------------------------------------------------------------------------
    float GeometrySchlickGGX(float NdotV, float roughness) {
        float r = (roughness + 1.0);
        float k = (r*r) / 8.0;

        float nom   = NdotV;
        float denom = NdotV * (1.0 - k) + k;

        return nom / denom;
    }
// ----------------------------------------------------------------------------
    float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
        float NdotV = max(dot(N, V), 0.0);
        float NdotL = max(dot(N, L), 0.0);
        float ggx2 = GeometrySchlickGGX(NdotV, roughness);
        float ggx1 = GeometrySchlickGGX(NdotL, roughness);

        return ggx1 * ggx2;
    }
// ----------------------------------------------------------------------------
    vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
        return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(1.0 - cosTheta, 5.0);
    }   
// ----------------------------------------------------------------------------
`;
}
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
//# sourceMappingURL=index.js.map