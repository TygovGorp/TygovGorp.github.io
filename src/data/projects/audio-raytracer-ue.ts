export default {
  order: 0, // lower = shown first
  title: 'UE Audio Raytracer',
  image: '/media/project/audio-tracer/audio-tracer-thumb.jpg',
  description: 'A Unreal Engine project implementing a plugin for ray tracing algorithm for audio rendering',
  tech: ['BUas', 'Unreal Engine', 'Audio', 'Ray tracing'],
  github: 'https://github.com/TygovGorp/RTA',
  
  fullDescription: `
    A school project where I implemented Occlusion, Reverb and and a simple Diffraction algorithm for audio rendering in Unreal Engine. 
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
};