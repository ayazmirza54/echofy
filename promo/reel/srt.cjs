// Writes subtitle files from timeline.js, timed exactly like the burned-in captions.
//   <base>.srt        one cue per voiceover line, wrapped to 42 chars x 2 lines
//   <base>.words.srt  short cues that appear word-group by word-group, matching
//                     the on-screen word reveal (Reels/Shorts-style captions)
// Usage: node srt.cjs <base path without extension>
const fs = require('fs');
const path = require('path');

require(path.join(__dirname, 'timeline.js'));
const voTiming = path.join(__dirname, 'vo_timing.js');
if (fs.existsSync(voTiming)) require(voTiming);
const { captions } = globalThis.TL;
const base = process.argv[2] || path.join(__dirname, '..', 'clone_mode_ep01');

const ts = s => {
  const ms = Math.round(s * 1000), p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
// Split into at most two balanced lines of <= max chars.
function wrap(text, max = 42) {
  if (text.length <= max) return text;
  const words = text.split(' ');
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
    const score = Math.max(a.length, b.length);
    if (!best || score < best.score) best = { score, text: a + '\n' + b };
  }
  return best.text;
}
const cue = (i, s, e, text) => `${i}\n${ts(s)} --> ${ts(e)}\n${text}\n`;


const lines = captions.map((c, i) => cue(i + 1, c.s, c.e, wrap(c.text)));

const words = [];
for (const c of captions) {
  const w = c.text.split(' '), starts = wordStarts(c), size = 3;
  for (let k = 0; k < w.length; k += size) {
    const s = starts[k];
    const e = k + size < w.length ? starts[k + size] : c.e;
    words.push(cue(words.length + 1, s, e, w.slice(k, k + size).join(' ')));
  }
}

fs.writeFileSync(base + '.srt', lines.join('\n'));
fs.writeFileSync(base + '.words.srt', words.join('\n'));
console.log(`  wrote ${base}.srt and ${base}.words.srt`);
