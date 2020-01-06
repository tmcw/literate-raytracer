// ## Shader Configuration
//
function getShaderConfiguration(scene: Scene) {
  // We'll put all of our configuration into an object
  // because much of our configuration is directly injected into GLSL code
  // and because WebGL's GLSL is ancient we're encoding our numbers as strings.
  // We're doing this to stop WebGL from complaining that `1` is not a float
  // this version of GLSL will want a full `1.0`
  return {
    // How much anti aliasing?  O for none, 2, for some, 4 for more
    aa: '0',
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
