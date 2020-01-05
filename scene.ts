// ## Scene
//
// We'll use the `getScene` function to create a `Scene` object
// our `Scene` object will essentially be a dictionary containing
//   * Camera details including position
//   * Spherical geometry to render using mathematical spheres
//   * Triangle geometry to render using vertecies
//   * Lighting details
//
// In the real world we'd likely use something a bit more sophisticated like a graph
// but for now, this will do.
type Triangle = { material: number, points: Matrix3_1[] };
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
  const triangleToNormal = (t: Triangle) => {
    const v0v1 = subtract3_1(t.points[1], t.points[0]);
    const v0v2 = subtract3_1(t.points[2], t.points[0]);
    const normal = normalize3_1(multiply3_1(v0v1, v0v2));
    return normal;
  };
  // we'll need a place to cache triangle normals
  let triangleNormals: Matrix3_1[] = [];
  //
  // #### Build the Spheres
  // We'll have one large static sphere in the centre and many other spheres
  // that we'll animate around the scene
  const spheres = (function () {
    // we'll also need to store the spheres somewhere
    const s: { radius: number, point: Matrix3_1, material: number }[] = [];

    // we'll initialize the spheres so they're not immediately overlapping
    // in order to do that we'll increment the radius for each sphere we add
    // to the scene
    let prevRadius = 0;
    // ##### Build a each sphere
    for (let i = 0; i < sphereCount; i += 1) {
      // the radius is either
      const radius = i === 0 
      // big for the centre sphere
      ? minOrbit - 1 
      // or small for the other spheres
      : (Math.random() / 2) + 0.1;

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
        ] as Matrix3_1,
        // each sphere has a "pointer" to a `material`
        // the "pointer" is an index in the `scene.materials` array
        material: Math.floor(Math.random() * 3),
      });

      // update the radius for the next sphere
      prevRadius = radius;
    }

    // ##### We now have some spheres!

    return s;
  }());

  // #### Triangles
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
        material: 4,
        points: [
          [g_floorPlaneSize, 0, -g_floorPlaneSize],
          [-g_floorPlaneSize, 0, -g_floorPlaneSize],
          [-g_floorPlaneSize, 0, g_floorPlaneSize],
        ] as Matrix3_1[],
      },
      {
        material: 4,
        points: [
          [-g_floorPlaneSize, 0, g_floorPlaneSize],
          [g_floorPlaneSize, 0, g_floorPlaneSize],
          [g_floorPlaneSize, 0, -g_floorPlaneSize],
        ] as Matrix3_1[],
      },
    ];
    // now that we have some triangles, let's pre-compute the normals
    triangleNormals = triangles.map(triangleToNormal);

  // #### Materials
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
    {
      colour: [100, 0, 0] as Matrix3_1,
      ambient: 0.01,
      diffuse: 0.5,
      specular: 0.1,
      refraction: 1.0,
      isTranslucent: false,
    },
    {
      colour: [0, 0, 124] as Matrix3_1,
      ambient: 0.1,
      diffuse: 0.01,
      specular: 0.8,
      refraction: 1.0,
      isTranslucent: false,
    },
    {
      colour: [0, 255, 0] as Matrix3_1,
      ambient: 0.1,
      diffuse: 0.01,
      specular: 0.9,
      refraction: 1.0,
      isTranslucent: false,
    },
    {
      colour: [0, 100, 200] as Matrix3_1,
      ambient: 0.1,
      diffuse: 0.8,
      specular: 0.02,
      refraction: 1.0,
      isTranslucent: false,
    },
    {
      colour: [200, 200, 200] as Matrix3_1,
      ambient: 0.1,
      diffuse: 0.8,
      specular: 0.02,
      refraction: 1.0,
      isTranslucent: false,
    },
    {
      colour: [0, 25, 50] as Matrix3_1,
      ambient: 0.1,
      diffuse: 0.8,
      specular: 0.02,
      refraction: 1.0,
      isTranslucent: false,
    },
  ];

  // ### The Actual Scene Object
  return {
    // let's build a camera
    camera: {
      point: [0, 5, 50] as Matrix3_1,
      fieldOfView: 45,
      rotation: [0, 0, 0] as Matrix3_1,
      up: [0, 1, 0] as Matrix3_1,
    },
    // in the BlinnPhong model we'll have a hard coded ambient lighting intensity
    globalAmbientIntensity: 0.002,
    // for simplicity our lights are just a single point in space
    lights: [[-25, 30, 10]] as Matrix3_1[],
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
    triangleNormals(onEach: (normal: Matrix3_1, t: Triangle, i: number) => any, useCache = false) {
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
  }
}