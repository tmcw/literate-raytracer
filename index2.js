"use strict";
const g_canvas = document.getElementById('c');
resize(g_canvas);
// const g_gl: WebGLRenderingContext = (window as any).WebGLDebugUtils.makeDebugContext(
// canvas.getContext('webgl')
// );
const g_gl = g_canvas.getContext('webgl');
if (!g_gl) {
    throw new Error('fail to launch gl');
}
const vertexSource = `
    attribute vec4 a_position;
     
    void main() {
       gl_Position = a_position;
    }
`;
const defaultF0 = 0.04;
const materialCount = 5;
const phongSpecularExp = '32.0';
const triangleCount = 3;
const lightCount = 1;
const sphereCount = 3;
const epsilon = 0.00005;
const bg = {
    r: '0.05',
    g: '0.05',
    b: '0.05',
};
const fragmentSource = `precision mediump float;

    struct Ray {
        vec3 point;
        vec3 vector;
    };

    struct Material {
        vec3 colourOrAlbedo;
        float ambient;
        float diffuseOrRoughness;
        float specularOrMetallic;
    };

    struct Hit {
        float distance;
        Material material;
        vec3 normal;
        vec3 position;
        Ray ray;
    };

    struct Sphere {
        vec3 point;
        float radius;
        int material;
    };

    struct SphereDistance {
        float distance;
        Sphere sphere;
    };

    struct Triangle {
        vec3 a;
        vec3 b;
        vec3 c;
        vec3 normal;
        int material;
    };

    struct TriangleDistance {
        float distance;
        Triangle triangle;
        vec3 intersectPoint;
        float u;
        float v;
    };

    struct PointLight {
        vec3 point;
    };
    const vec4 bgColour = vec4(${bg.r}, ${bg.g}, ${bg.b}, 1.0);
    const float PI = ${Math.PI};

    uniform float aspectRatio;
    uniform vec3 cameraPos;
    uniform mat4 cameraMatrix;
    uniform float globalAmbientIntensity;
    uniform float height;
    uniform float scale;
    uniform float width;
     
    uniform Material materials[${materialCount}];
    uniform Sphere spheres[${sphereCount}];
    uniform PointLight pointLights[${lightCount}];
    uniform Triangle triangles[${triangleCount}];

    float sphereIntersection(Sphere sphere, Ray ray);
    TriangleDistance triangleIntersection(Triangle triangle, Ray ray);
    SphereDistance intersectSpheres(Ray ray);
    TriangleDistance intersectTriangles(Ray ray);
    vec4 cast1(Ray ray);
    vec4 cast2(Ray ray);
    vec4 cast3(Ray ray);
    vec3 sphereNormal(Sphere sphere, vec3 pos);
    vec4 surfacePhong(Hit hit);
    vec4 surfacePbr1(Hit hit);
    vec4 surfacePbr2(Hit hit);
    bool isLightVisible(vec3 pt, vec3 light, vec3 normal);
    vec4 draw(float xo, float yo);
    float DistributionGGX(vec3 N, vec3 H, float roughness);
    float GeometrySchlickGGX(float NdotV, float roughness);
    float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness);
    vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness);

     
    void main() {
        vec3 total = vec3(0.0);

        total += draw(0.25, 0.25).rgb;
        total += draw(0.75, 0.25).rgb;
        total += draw(0.75, 0.75).rgb;
        total += draw(0.25, 0.75).rgb;

        gl_FragColor = vec4(total.rgb / 4.0, 1.0);
    }

    vec4 draw(float xo, float yo) {
        float px = gl_FragCoord.x;
        float py = gl_FragCoord.y;

        float x = (2.0 * (px + xo) / width - 1.0) * scale;
        float y = (2.0 * (py + yo) / height - 1.0) * scale * 1.0 / aspectRatio;

        vec3 dir = vec3(0.0, 0.0, 0.0);

        dir.x = x    * cameraMatrix[0][0] + y * cameraMatrix[1][0] + -1.0 * cameraMatrix[2][0];
        dir.y = y    * cameraMatrix[0][1] + y * cameraMatrix[1][1] + -1.0 * cameraMatrix[2][1];
        dir.z = -1.0 * cameraMatrix[0][2] + y * cameraMatrix[1][2] + -1.0 * cameraMatrix[2][2];

        Ray ray = Ray(cameraPos, normalize(dir));

        return cast1(ray);
    }

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

        return materials[0];
    }

    Hit trace(Ray ray) {
       SphereDistance sd = intersectSpheres(ray);
       TriangleDistance td = intersectTriangles(ray);
       if (sd.distance <= 0.0 && td.distance <= 0.0) {
           return Hit(
               -1.0,
               Material(vec3(0.0, 0.0, 0.0), 0.0, 0.0, 0.0),
               vec3(0.0, 0.0, 0.0),
               vec3(0.0, 0.0, 0.0),
               Ray(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.0))
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

    vec4 cast1(Ray ray) {
        Hit hit = trace(ray);

        if (hit.distance < 0.0) {
            return bgColour;
        }

        if (hit.distance < 0.0) {
            return surfacePhong(hit);
        } else {
            return surfacePbr1(hit);
        }
    }

    vec4 cast2(Ray ray) {
        Hit hit = trace(ray);

        if (hit.distance < 0.0) {
            return bgColour;
        }

        if (hit.distance < 0.0) {
            return surfacePhong(hit);
        } else {
            return surfacePbr2(hit);
        }
    }

    vec4 cast3(Ray ray) {
        Hit hit = trace(ray);

        if (hit.distance < 0.0) {
            return bgColour;
        }

        return surfacePhong(hit);
    }

    vec3 sphereNormal(Sphere sphere, vec3 pos) {
        return normalize(pos - sphere.point);
    }

    SphereDistance intersectSpheres(Ray ray) {
        SphereDistance sd = SphereDistance(-1.0, Sphere(
            vec3(0.0, 0.0, 0.0), 
            -1.0,
            0));
        for (int i = 0; i < ${sphereCount}; i += 1) {
            Sphere s = spheres[i];
            float dist = sphereIntersection(s, ray);
            if (dist >= 0.0) {
                if (sd.distance <= 0.0 || dist < sd.distance) {
                    sd.distance = dist;
                    sd.sphere = s;
                }
            }
        }
        return sd;
    }

    TriangleDistance intersectTriangles(Ray ray) {
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
                if (least.distance <= 0.0 || td.distance < least.distance) {
                    least = td;
                }
            }
        }
        return least;
    }

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

    bool isLightVisible(vec3 pt, vec3 light, vec3 normal) {
        vec3 unit = normalize(light - pt);
        Ray ray = Ray(pt + vec3(normal.xyz + ${epsilon}), unit);
        SphereDistance sd = intersectSpheres(ray);

        if (sd.distance > 0.0) {
            return false;
        }

        TriangleDistance td = intersectTriangles(ray);

        return td.distance < 0.0;
    }

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

    vec4 surfacePbrReflectance(Hit hit, vec3 N, vec3 V, vec3 R, vec3 reflectColour) {
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
                Lo += (kD * albedo / PI + specular) * radiance * NdotL;  // note that we already multiplied the BRDF by the Fresnel (kS) so we won't multiply by kS again
            }
        }

        if (didLight == false) {
            return vec4(0.0, 0.0, 0.0, 1.0);
        }

        // ambient lighting (will replace this ambient lighting with 
        // environment lighting).
        vec3 ambient = vec3(0.03) * albedo * ao;
    
        vec3 colour = ambient + Lo;


        // HDR tonemapping
        colour = colour / (colour + vec3(1.0));

        colour = linearToSrgbF(colour);

        return vec4(colour.rgb, 1.0);
    }

    vec4 surfacePbr1(Hit hit) {
        vec3 N = hit.normal;
        vec3 V = normalize(hit.ray.point - hit.position);
        vec3 R = reflect(-V, N);   
        vec3 reflectColour = cast2(Ray(hit.position, R)).rgb;

        return surfacePbrReflectance(hit, N, V, R, reflectColour);
    }

    vec4 surfacePbr2(Hit hit) {
        vec3 N = hit.normal;
        vec3 V = normalize(hit.ray.point - hit.position);
        vec3 R = reflect(-V, N);   

        return surfacePbrReflectance(hit, N, V, R, vec3(1.0, 1.0, 1.0));
    }

    vec4 surfacePhong(Hit hit) {
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

        return vec4(ambient.rgb + diffuse.rgb * material.diffuseOrRoughness + specular.rgb * material.specularOrMetallic, 1.0);
    }

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
`;
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
    if (resize(g_canvas)) {
        setupScene(gl, context, g_scene);
    }
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
const FD = 25;
const g_scene = {
    camera: {
        point: [0, 5, 50],
        fieldOfView: 45,
        rotation: [0, 0, 0],
        up: [0, 1, 0],
    },
    globalAmbientIntensity: 0.002,
    lights: [[-25, 30, 10]],
    materials: [
        // {
        //     colour: [100, 0, 0] as Matrix3_1,
        //     ambient: 0.1,
        //     diffuse: 0.7,
        //     specular: 0.2,
        // },
        {
            colour: [100, 0, 0],
            ambient: 0.01,
            diffuse: 0.5,
            specular: 0.1,
        },
        {
            colour: [0, 0, 124],
            ambient: 0.1,
            diffuse: 0.01,
            specular: 0.8,
        },
        {
            colour: [0, 255, 0],
            ambient: 0.1,
            diffuse: 0.01,
            specular: 0.9,
        },
        {
            colour: [0, 100, 200],
            ambient: 0.1,
            diffuse: 0.8,
            specular: 0.02,
        },
        {
            colour: [200, 200, 200],
            ambient: 0.1,
            diffuse: 0.8,
            specular: 0.02,
        },
    ],
    spheres: [
        {
            type: 'sphere',
            material: 0,
            point: [0, 5, -3],
            radius: 3
        },
        {
            type: 'sphere',
            material: 1,
            point: [-4, 5, -1],
            radius: 0.2
        },
        {
            type: 'sphere',
            material: 2,
            point: [-4, 5, -1],
            radius: 0.1
        },
    ],
    triangles: [
        {
            type: 'triangle',
            material: 3,
            points: [
                [3, 7, -7],
                [-5, 7, -7],
                [-5, 5, -7],
            ],
        },
        {
            type: 'triangle',
            material: 4,
            points: [
                [FD, 0, -FD],
                [-FD, 0, -FD],
                [-FD, 0, FD],
            ],
        },
        {
            type: 'triangle',
            material: 4,
            points: [
                [-FD, 0, FD],
                [FD, 0, FD],
                [FD, 0, -FD],
            ],
        },
    ],
};
const g_ctx = bindProgram(g_gl);
const uniforms = setupScene(g_gl, g_ctx, g_scene);
draw(g_gl, g_ctx);
let planet1 = 0;
let planet2 = 0;
let zod1 = 0.05;
const animate = () => {
    planet1 += 0.01;
    planet2 += 0.02;
    // move zod around
    if (g_scene.triangles[0].points[0][1] > 10.5) {
        zod1 *= -1;
    }
    else if (g_scene.triangles[0].points[0][1] < 4.5) {
        zod1 *= -1;
    }
    g_scene.triangles[0].points[0][1] += zod1;
    // set the position of each moon with some trig.
    g_scene.spheres[1].point[0] = Math.sin(planet1) * 3.5;
    g_scene.spheres[1].point[2] = -3 + (Math.cos(planet1) * 3.5);
    g_scene.spheres[2].point[0] = Math.sin(planet2) * 4;
    g_scene.spheres[2].point[2] = -3 + (Math.cos(planet2) * 4);
    g_scene.spheres.forEach((o, i) => {
        uniforms.spheres(i, o.radius, o.material, o.point);
    });
    g_scene.triangles.forEach((t, i) => {
        const v0v1 = subtract3_1(t.points[1], t.points[0]);
        const v0v2 = subtract3_1(t.points[2], t.points[0]);
        const normal = normalize3_1(multiply3_1(v0v1, v0v2));
        uniforms.triangles(i, t.points[0], t.points[1], t.points[2], t.material, normal);
    });
    draw(g_gl, g_ctx);
    requestAnimationFrame(animate);
};
animate();
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
        u.materials(i, m.colour, m.ambient, m.diffuse, m.specular);
    });
    spheres.forEach((s, i) => {
        u.spheres(i, s.radius, s.material, s.point);
    });
    triangles.forEach((t, i) => {
        const v0v1 = subtract3_1(t.points[1], t.points[0]);
        const v0v2 = subtract3_1(t.points[2], t.points[0]);
        const normal = normalize3_1(multiply3_1(v0v1, v0v2));
        u.triangles(i, t.points[0], t.points[1], t.points[2], t.material, normal);
    });
    lights.forEach((l, i) => {
        u.lights(i, l);
    });
    return u;
}
function getUniformLocation(gl, program, name) {
    const location = gl.getUniformLocation(program, name);
    if (!location) {
        throw new Error('could not get uniform location ' + name);
    }
    return location;
}
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
        materials(index, colourOrAlbedo, ambient, diffuseOrRoughness, specularOrMetallic) {
            setVec3(materials[index].colour, colourOrAlbedo);
            setFloat(materials[index].ambient, ambient);
            setFloat(materials[index].diffuse, diffuseOrRoughness);
            setFloat(materials[index].specular, specularOrMetallic);
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
function resize(canvas) {
    // Lookup the size the browser is displaying the canvas.
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    // Check if the canvas is not the same size.
    if (canvas.width != displayWidth || canvas.height != displayHeight) {
        // Make the canvas the same size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        return true;
    }
    return false;
}
