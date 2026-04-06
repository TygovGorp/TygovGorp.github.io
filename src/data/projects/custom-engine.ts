export default {
  title: 'Custom Game Engine',
  image: '/media/project/custom-engine/custom-engine-thumb.png',
  description: 'A custom game engine built from scratch with focus on performance and flexibility.',
  tech: ['C++', 'OpenGL', 'Physics simulation', 'Asset pipeline'],
  github: 'https://github.com/yourusername/custom-engine',
  
  fullDescription: `
    A custom game engine built from scratch with focus on performance and flexibility.
    Features a modular architecture for easy extension and maintenance.
  `,
  features: [
    'Screen-space raymarching for efficiency',
    'Temporal filtering to reduce noise',
    'Phase function for anisotropic scattering',
    'Height-based fog density',
    'Integration with existing shadow maps'
  ],
  codeSnippet: `// Volumetric fog raymarching
vec4 raymarchFog(vec3 rayOrigin, vec3 rayDir, float depth) {
    float stepSize = depth / float(STEPS);
    vec3 accumFog = vec3(0.0);
    float transmittance = 1.0;
    
    for (int i = 0; i < STEPS; i++) {
        vec3 pos = rayOrigin + rayDir * (stepSize * float(i));
        float density = sampleFogDensity(pos);
        vec3 light = calculateScattering(pos, density);
        
        accumFog += light * density * transmittance * stepSize;
        transmittance *= exp(-density * stepSize * EXTINCTION);
    }
    
    return vec4(accumFog, 1.0 - transmittance);
}`,
  videoUrl: null,
};