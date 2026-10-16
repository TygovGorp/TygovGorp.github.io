// PORTFOLIO TODO (proof, feedback point 3):
// - Source: no `github` link. If the repo is private (team/school), add
//   "Source available on request" to fullDescription.
// - Code sample: add `codeSnippet` from your PS5 rendering work, 15-30 lines.
// - Numbers: frame rate / frame time on PS5, team size per discipline, project length.
// - "UI progress bar" is vague: say what it shows (e.g. every racer's position on the track)
//   or drop it.
export default {
  order: 2, // lower = shown first
  title: 'Catch My Drift',
  image: '/media/project/catch-my-drift/catch-my-drift-thumb.png',
  description: 'Tech lead for a team of 8 programmers on a racing game built in our own engine, Vroom, for Windows and PS5.',
  tech: ['School', 'Tech Lead', 'Team Project'],

  fullDescription: `
    Catch My Drift is a racing game made by a student team of programmers, designers and artists.
    It runs on Vroom, our own custom engine, on both Windows and PS5. I was the tech lead for the
    team's 8 programmers: I planned the work, made the engine architecture decisions, reviewed the
    code and kept the programming side aligned with design and art. Alongside leading, I worked on
    PS5 rendering and the game's UI.
  `,
  contributions: [
    'Tech lead for a team of 8 programmers',
    'Planned and divided the programming work each sprint',
    "Reviewed and merged the team's code",
    'Kept the programming work in line with the designers and artists',
    'PS5 rendering',
    'UI progress bar',
  ],
  features: [
    'Cross-platform support for Windows and PS5'
  ],
  videoUrl: 'https://www.youtube.com/watch?v=y4MbvOPPv5k',
};
