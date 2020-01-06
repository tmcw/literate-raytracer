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

// Part of our configuration is also [the scene](scene.html "The Scene Object")
type Scene = typeof g_scene;
const g_scene = getScene();


// We're going to want to tweak a lot of different variables, let's put all of our
// configuration [in on place for easy updates](shader-configuration.html "Centralized Config").
// the shader's configuration _will_ depend on the parameters of our scene due to limitations
// with the "flexibility" of WebGL 1.x GLSL

type ConfigShader = typeof g_configShader;
const g_configShader = getShaderConfiguration(g_scene);


// 
// <a name="html"></a>
// ## 1. HTML
//
// We'll [setup the HTML](html.html "HTML Setup code")
//
const g_html = bindToHTML();


//
// <a name="webgl"></a>
// ## 2. WebGL Initialization
//
// In order to upload things to the GPU and renderthem on the canvas we'll need to work
// with an API.  We can ask our canvas for a [WebGLRenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext "WebGL Rendering Context is the API we use to upload stuff to the GPU");
// which will be the API we use to upload stuff to the GPU.
const g_gl = g_html.canvas.getContext('webgl');

// The world is an imperfect place, let's make sure we got a valid context
throwIfFalsey(g_gl, 'could not get a WebGL context');
// Okay, great, so we've got a an API that let's us talk to the GPU.  Alone that's
// not enough for us to get started.  We need to give the GPU some code to run
// we're going to need at least one GLSL program, that code is [located in shaders.ts](shaders.html "Our shaders, the 'body' of our program")

const g_ctx = bindProgram(g_gl, getVertexSource(), getFragmentSource(g_configShader));
const g_uniforms = setupScene(g_gl, g_ctx, g_scene);
draw(g_gl, g_ctx, g_html.canvas);

//
// <a name="state"></a>
// ## 3. Application State
//
const g_planetStates = (function () {
    const states: { matrix: Matrix4_4, vector: Matrix3_1 }[] = [];

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

//
// <a name="animate"></a>
// 4. ## Animate!
//
// start the animation by default
let g_isAnimating = true;

// on each frame...
const animate = (time: number) => {
    if (g_isAnimating === false) {
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
        }

        const sphere = g_scene.spheres[i];
        if (i > 0) {
            sphere.point = [state.matrix[12], state.matrix[13], state.matrix[14]];
            g_planetStates[i] = state;
        }

        g_uniforms.spheres(i, sphere.radius, sphere.material, sphere.point);
    });

    g_scene.triangleNormals((normal, t, i) => {
        g_uniforms.triangles(i, t.points[0], t.points[1], t.points[2], t.material, normal);
    }, true);

    draw(g_gl, g_ctx, g_html.canvas);
    requestAnimationFrame(animate);
};

// if we press play, make sure we're animating
if (g_html.play) {
    g_html.play.addEventListener('click', () => {
        if (g_isAnimating) {
            return;
        }
        g_isAnimating = true;
        animate(0);
    });
}

// if we press stop, stop the animation
if (g_html.stop) {
    g_html.stop.addEventListener('click', () => {
        g_isAnimating = false;
    });
}

// finally kick it all off
animate(0);

