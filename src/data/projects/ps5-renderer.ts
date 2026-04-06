export default {
  title: 'PS5 PBR renderer',
  image: '/media/project/ps5-renderer/ps5-renderer-thumb.jpeg',
  description: 'Real-time physically-based renderer with image-based lighting and cascade shadow mapping.',
  tech: ['Cook-Torrance BRDF', 'IBL with split-sum approximation', 'Cascade shadow maps with PCF'],
  github: 'https://github.com/yourusername/pbr-renderer',
  
  fullDescription: `
    Screen-space volumetric fog system with physically-based light scattering.
    Uses raymarching with temporal reprojection for performance optimization.
    Supports multiple light sources with colored fog and dynamic density.
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