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

  // Voiceover text-to-speech (voiceover.py, Kokoro). Voices: af_heart, af_bella,
  // am_michael, am_fenrir, am_puck, bm_george, ...
  tts: { voice: "af_heart", speed: 1.08 },

  // Voiceover lines. Spoken by the TTS voiceover starting at `s`, burned in as
  // captions, and exported as .srt. `say` overrides the text for pronunciation.
  captions: [
    { s: 0.2,  e: 4.9,  text: "I've been using some insanely good apps lately. But then I had a thought..." },
    { s: 5.2,  e: 11.6, text: "What if I could rebuild their best features... just by vibe coding?" },
    { s: 13.6, e: 21.8, text: "First up, Wispr Flow. Hold a key, talk, and your words just appear. So I built my own, with Whisper running locally.",
      say: "First up, Whisper Flow. Hold a key, talk, and your words just appear. So I built my own, with Whisper running locally." },
    { s: 22.2, e: 28.0, text: "A few prompts, some generated Python, a couple of bugs..." },
    { s: 28.0, e: 30.8, text: "okay, a lot of bugs." },
    { s: 31.0, e: 33.8, text: "And suddenly, it's actually working." },
    { s: 34.8, e: 39.8, text: "Meet Echofy. Hold Right Control, speak, let go, and it types for you.",
      say: "Meet Echo-fy. Hold right control, speak, let go, and it types for you." },
    { s: 40.0, e: 46.6, text: "Whisper runs on my own laptop. No cloud, no API keys, and it even works over Remote Desktop." },
    { s: 47.3, e: 50.6, text: "And this is just the beginning." },
    { s: 51.6, e: 54.2, text: "One popular app at a time." },
    { s: 54.4, e: 58.6, text: "Let's see how far AI can take us." },
  ],
};

// When each word of a caption appears: spread over the line's spoken duration
// (vo_timing.js, from voiceover.py) weighted by word length, or at a steady
// pace when there is no voiceover. Shared by scene.html and srt.cjs.
globalThis.wordStarts = function (c) {
  const words = c.text.split(' ');
  const vo = globalThis.VO && globalThis.VO[globalThis.TL.captions.indexOf(c)];
  if (!vo) {
    const per = Math.min(.3, (c.e - c.s) * .75 / words.length);
    return words.map((_, i) => c.s + i * per);
  }
  const w = words.map(x => x.length + 2), total = w.reduce((a, b) => a + b, 0);
  let acc = 0;
  return words.map((_, i) => { const s = c.s + vo * acc / total; acc += w[i]; return s; });
};
