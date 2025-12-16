export default {
  title: 'PBR Renderer',
  image: '/projects/pbr-thumb.jpg',
  description: 'Real-time physically-based renderer with image-based lighting and cascade shadow mapping.',
  tech: ['Cook-Torrance BRDF', 'IBL with split-sum approximation', 'Cascade shadow maps with PCF'],
  github: 'https://github.com/yourusername/pbr-renderer',
  
  // FULL DETAILS FOR MODAL
  fullDescription: `
    A complete physically-based rendering system built from scratch using OpenGL. 
    Implements modern PBR workflows with support for metallic-roughness materials,
    image-based lighting, and real-time shadows.
    
    Key features include dynamic environment mapping, multiple light sources,
    and optimized for 60fps at 1080p on mid-range hardware.
  `,
  features: [
    'Cook-Torrance BRDF with GGX distribution',
    'Split-sum approximation for IBL',
    'Cascade shadow mapping with PCF filtering',
    'Real-time environment probes',
    'Material editor with live preview'
  ],
  codeSnippet: `// Fragment shader - PBR lighting calculation
vec3 calculatePBR(vec3 N, vec3 V, vec3 L, vec3 albedo, 
                  float metallic, float roughness) {
    vec3 H = normalize(V + L);
    float NdotL = max(dot(N, L), 0.0);
    float NdotV = max(dot(N, V), 0.0);
    float NdotH = max(dot(N, H), 0.0);
    
    // Cook-Torrance specular
    float D = distributionGGX(NdotH, roughness);
    float G = geometrySmith(NdotV, NdotL, roughness);
    vec3 F = fresnelSchlick(max(dot(H, V), 0.0), 
                           mix(vec3(0.04), albedo, metallic));
    
    vec3 specular = (D * G * F) / (4.0 * NdotV * NdotL + 0.001);
    vec3 diffuse = albedo * (1.0 - metallic) / PI;
    
    return (diffuse + specular) * NdotL;
}`,
  videoUrl: null, // Optional: Add YouTube embed or video file
};
