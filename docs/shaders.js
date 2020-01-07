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
