// Shared timeline for the visuals (scene.html) and the music (music.mjs).
// Classic script: sets globalThis.TL so it loads from file:// and from Node.
globalThis.TL = {
  fps: 30,
  duration: 60,
  bpm: 120, // beat = 0.5s, bar = 2s -> every scene boundary lands on a beat

  // Edit these before rendering.
  series: "CLONE MODE",
  episode: "EP 01",
  episodeTitle: "REBUILDING WISPR FLOW",
  appName: "ECHOFY",
  handle: "@ayazmirza54",

  scenes: [
    { name: "hook",      start: 0,  end: 5 },
    { name: "challenge", start: 5,  end: 12 },
    { name: "target",    start: 12, end: 22 },
    { name: "montage",   start: 22, end: 34 },
    { name: "reveal",    start: 34, end: 47 },
    { name: "teaser",    start: 47, end: 60 },
  ],

  // Four-on-the-floor sections; the visuals pulse on these kicks too.
  kickSections: [[5, 12], [13.5, 22], [22, 33.75], [34, 47], [51, 58]],

  // Big hits: slams, stamps and the drop. [time, strength 0..1]
  impacts: [[2.4, 0.8], [3.6, 0.7], [3.85, 1], [6.5, 0.5], [7.5, 0.5], [8.5, 0.5],
            [12, 0.9], [28, 0.7], [34, 1], [49, 0.6], [49.5, 0.6], [51, 1], [53.5, 0.7]],

  // Glitch / whoosh transitions.
  transitions: [0.9, 5, 9.2, 12, 13.6, 22, 24, 26, 27, 28, 30, 31, 34, 35, 47, 53.5],

  // Voiceover lines. Burned in as captions and exported as voiceover.srt
  // so a real VO can be recorded against the same timing.
  captions: [
    { s: 0.3,  e: 4.8,  text: "I've been using some insanely good apps lately. But then I had a thought..." },
    { s: 5.2,  e: 11.6, text: "What if I could recreate their best features... just by vibe coding?" },
    { s: 13.6, e: 21.8, text: "First up, Wispr Flow. I wanted voice typing, AI cleanup, and a smooth floating interface." },
    { s: 22.2, e: 28.0, text: "A few prompts, some generated code, a couple of bugs..." },
    { s: 28.0, e: 30.8, text: "okay, a lot of bugs." },
    { s: 31.0, e: 33.8, text: "And suddenly, it's actually working." },
    { s: 35.0, e: 39.6, text: "Meet my own take on AI-powered dictation." },
    { s: 40.0, e: 46.4, text: "Built my way, with the features I actually want." },
    { s: 47.3, e: 50.6, text: "And this is just the beginning." },
    { s: 51.6, e: 54.2, text: "One popular app at a time." },
    { s: 54.4, e: 58.6, text: "Let's see how far AI can take us." },
  ],
};
