export default {
  title: 'CPU Path Tracer',
  image: '/projects/pathtracer-thumb.jpg',
  description: 'A simple CPU-based path tracer implementing ray tracing algorithms.',
  tech: ['Ray tracing', 'Monte Carlo integration', 'Material shading'],
  github: 'https://github.com/yourusername/cpu-pathtracer',
  
  fullDescription: `
    A simple CPU-based path tracer implementing ray tracing algorithms.
    Supports various materials and lighting models for realistic rendering.
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