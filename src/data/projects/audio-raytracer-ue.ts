// PORTFOLIO TODO (proof, feedback point 3):
// - Video: audio needs a video more than any other project. Record a 20-30 s clip walking
//   behind a wall / into a room so the occlusion and reverb are audible. Set `videoUrl`.
// - Code sample: add `codeSnippet` with e.g. the per-frequency-band ray tracing or the
//   occlusion calculation, 15-30 lines.
// - Numbers: rays per source, update rate, ms per frame, and how many sources it handles.
export default {
  order: 1, // lower = shown first
  title: 'UE Audio Raytracer',
  image: '/media/project/audio-raytracer-ue/audio-raytracer-ue-thumb.png',
  description: 'An Unreal Engine plugin that uses ray tracing for audio rendering.',
  tech: ['School', 'Unreal Engine', 'Audio'],
  github: 'https://github.com/TygovGorp/RTA',
  
  fullDescription: `A school project where I implemented occlusion, reverb and a simple diffraction algorithm for audio rendering in Unreal Engine. 
    The project is a plugin that can be used in any Unreal Engine 5.8 project to enhance the audio experience by simulating how sound interacts with the environment.
  `,
  features: [
    'Occlusion for realistic sound blocking',
    'Reverb for spatial sound effects',
    'Diffraction for sound bending around obstacles',
    'Integration with Unreal Engine audio system',
    'Multi-threaded processing for performance optimization'
  ],
  videoUrl: null,
  blogPosts: ['how-an-audio-ray-tracer-works'], // slugs from src/data/blog/; shows a Write-up link
};