// Synthesizes the soundtrack (120 BPM, F minor) from timeline.js and writes
// a 16-bit stereo WAV. No samples: every sound is generated here.
// Usage: node music.mjs out.wav
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
await import(path.join(here, 'timeline.js'));
const TL = globalThis.TL;

const SR = 44100, N = Math.ceil(TL.duration * SR), BEAT = 60 / TL.bpm;
const L = new Float32Array(N), R = new Float32Array(N);
const music = new Float32Array(N); // ducked by the kick (sidechain)
const send = new Float32Array(N);  // reverb send

let seed = 1;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 * 2 - 1;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const idx = t => Math.floor(t * SR);
const inRange = (t, ranges) => ranges.some(([a, b]) => t >= a && t < b);

// --- voices -------------------------------------------------------------
function add(buf, t0, dur, fn, gain = 1, rev = 0) {
  const s0 = idx(t0), n = Math.floor(dur * SR);
  for (let i = 0; i < n; i++) {
    const j = s0 + i; if (j < 0 || j >= N) continue;
    const v = fn(i / SR, i) * gain;
    buf[j] += v; if (rev) send[j] += v * rev;
  }
}
const kick = (t0, g = 1) => { let ph = 0; add(L, t0, .45, (t) => {
  ph += 2 * Math.PI * (45 + 110 * Math.exp(-t * 28)) / SR;
  return Math.sin(ph) * Math.exp(-t * 7) + (t < .004 ? rnd() * .5 : 0);
}, .95 * g); };
function hat(t0, g = .18, dec = 45) { let prev = 0; add(L, t0, .12, (t) => { const n = rnd(), h = n - prev; prev = n; return h * Math.exp(-t * dec); }, g * .5); }
function clap(t0, g = .45) { let lp = 0; add(L, t0, .35, (t) => {
  const n = rnd(); lp += (n - lp) * .5; const env = Math.exp(-t * 18) * (t < .03 ? (Math.floor(t * 300) % 2 ? 1 : .4) : 1);
  return (n - lp) * env + Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 30) * .4;
}, g, .5); }
function bass(t0, dur, midi, g = .5) { const f = mtof(midi); let lp1 = 0, lp2 = 0;
  add(music, t0, dur, (t) => {
    const saw = 2 * ((f * t) % 1) - 1, sub = Math.sin(2 * Math.PI * f * t);
    const cut = .02 + .12 * Math.exp(-t * 12);
    lp1 += (saw - lp1) * cut; lp2 += (lp1 - lp2) * cut;
    return (lp2 * .9 + sub * .7) * Math.min(1, t * 200) * Math.min(1, (dur - t) * 60);
  }, g); }
function pad(t0, dur, notes, g = .12, bright = .03) { const lps = notes.map(() => [0, 0]);
  add(music, t0, dur, (t) => {
    let v = 0;
    notes.forEach((m, k) => { for (const d of [-.08, .08]) { const f = mtof(m + d); const s = 2 * ((f * t + k * .3) % 1) - 1; lps[k][0] += (s - lps[k][0]) * bright; v += lps[k][0]; } });
    return v * Math.min(1, t / .4) * Math.min(1, (dur - t) / .5);
  }, g, .6); }
function pluck(t0, midi, g = .16) { const f = mtof(midi); let lp = 0;
  add(music, t0, .3, (t) => { const sq = ((f * t) % 1) < .5 ? 1 : -1; lp += (sq - lp) * (.05 + .3 * Math.exp(-t * 25)); return lp * Math.exp(-t * 9); }, g, .45); }
function impact(t0, s = 1) {
  add(L, t0, 1.8, (t) => Math.sin(2 * Math.PI * (38 + 60 * Math.exp(-t * 10)) * t) * Math.exp(-t * 2.6), .9 * s);
  let lp = 0; add(L, t0, 1.6, (t) => { const n = rnd(); lp += (n - lp) * .25; return (n - lp * .6) * Math.exp(-t * 4); }, .32 * s, .8);
}
function whoosh(tc, dur = .5, g = .22) { let lp = 0;
  add(L, tc - dur * .7, dur, (t) => { const x = t / dur, env = Math.sin(Math.PI * x) ** 2, c = .02 + .3 * x; const n = rnd(); lp += (n - lp) * c; return lp * env; }, g * 2, .3); }
function riser(t0, t1, g = .35) { let lp = 0, ph = 0; const d = t1 - t0;
  add(L, t0, d, (t) => { const x = t / d; const n = rnd(); lp += (n - lp) * (.01 + .4 * x * x); ph += 2 * Math.PI * (200 + 1400 * x * x) / SR; return (lp * 1.4 + Math.sin(ph) * .25) * x * x; }, g, .3); }
function blip(t0, f, g = .12, dur = .04) { add(L, t0, dur, (t) => (Math.floor(t * f * 2) % 2 ? 1 : -1) * Math.exp(-t * 60), g); }
function buzz(t0) { add(L, t0, .45, (t) => (((110 * t) % 1) < .5 ? 1 : -1) * .6 * (1 - t / .45) + (((116 * t) % 1) < .5 ? .4 : -.4) * (1 - t / .45), .2); }
function click(t0, g = .07) { add(L, t0, .02, (t) => rnd() * Math.exp(-t * 400), g); }
function drone(t0, t1, g = .2) { add(music, t0, t1 - t0, (t) => (Math.sin(2 * Math.PI * 43.65 * t) + .3 * Math.sin(2 * Math.PI * 87.3 * t + Math.sin(t * 2))) * Math.min(1, t / 1) * Math.min(1, (t1 - t0 - t) / .2), g); }

// --- arrangement ----------------------------------------------------------
// Fm - Db - Ab - Eb, one chord per bar (2s)
const CHORDS = [[53, 56, 60, 65], [49, 53, 56, 61], [56, 60, 63, 68], [51, 55, 58, 63]];
const ROOTS = [29, 25, 32, 27];
const chordAt = t => Math.floor(t / 2) % 4;

drone(0, 5);
for (let t = .9; t < 2.4; t += t < 1.9 ? .125 : .0625) { blip(t, 800 + (rnd() + 1) * 1200, .1); click(t, .12); }
for (const [t, s] of TL.impacts) impact(t, s);
for (const t of TL.transitions) whoosh(t, .45, .16);

const grooveOn = [[5, 12], [13.5, 22], [22, 33.75], [34, 47], [51, 58]];
for (const [a, b] of TL.kickSections) for (let t = a; t < b - 1e-6; t += BEAT) kick(t);
for (let t = 5; t < 58; t += BEAT / 2) {
  if (!inRange(t, grooveOn)) continue;
  const off = Math.round(t / (BEAT / 2)) % 2 === 1;
  if (t >= 14 && (off || t >= 22)) hat(t, off ? .2 : .1);
  if (t >= 22 && t < 47) hat(t + BEAT / 4, .07, 70);
  if (t >= 5 && t < 14 && off) hat(t, .12);
}
for (let t = 14 + BEAT; t < 58; t += 2 * BEAT) if (inRange(t, [[14, 22], [22, 31], [34, 47], [51, 58]])) clap(t);
// pads
pad(5, 1.05, CHORDS[chordAt(4)], .08, .025); bass(5, 1, ROOTS[chordAt(4)] + 12, .32);
for (let t = 6; t < 47; t += 2) {
  if (t === 12) continue;
  pad(t, 2.05, CHORDS[chordAt(t)], t >= 34 ? .1 : .08, t >= 34 ? .05 : .025);
}
pad(12, 2, CHORDS[0], .1, .015);
// bass: sustained in the intro groove, offbeat 8ths later, rolling 16ths in the drop
for (let t = 5; t < 58; t += BEAT / 2) {
  if (!inRange(t, [[5, 12], [14, 33.75], [34, 47], [51, 58]])) continue;
  const root = ROOTS[chordAt(t)], k = Math.round(t / (BEAT / 2)) % 2;
  if (t < 12) { if (Math.abs(t % 2) < 1e-6) bass(t, 1.95, root + 12, .32); }
  else if (t < 34 || t >= 51) { if (k === 1) bass(t, BEAT / 2 * .9, root + 12, .45); }
  else { bass(t, BEAT / 4 * .85, root + 12, .5); bass(t + BEAT / 4, BEAT / 4 * .85, root + (k ? 24 : 12), .42); }
}
// arp in the montage (light) and the drop (full)
for (let t = 22; t < 47; t += BEAT / 4) {
  if (!inRange(t, [[24, 33.75], [34, 47]])) continue;
  const ch = CHORDS[chordAt(t)], i = Math.round(t / (BEAT / 4));
  const seq = [0, 1, 2, 3, 2, 1, 3, 2];
  pluck(t, ch[seq[i % 8]] + 12, t >= 34 ? .15 : .07);
}
// breakdown + end
pad(47, 4, CHORDS[0].map(n => n + 12), .09, .02);
riser(49.5, 51, .25);
for (let t = 22; t < 24; t += .055) click(t + (rnd() + 1) * .01);   // typing the prompt
for (let t = 30; t < 30.25; t += .05) click(t);                       // "fix it."
for (let t = 31.05; t < 31.4; t += .03) click(t);                     // npm run dev
for (const t of [31.5, 32, 32.5, 33]) blip(t, 1760, .12, .09);        // checkmarks
buzz(28); for (let i = 0; i < 22; i++) blip(28.6 + i * 1.2 / 22, 220 + i * 30, .08, .06);
riser(31, 33.75, .45);
for (let t = 32; t < 33.75; t += Math.max(.0625, BEAT / 2 * (1 - (t - 32) / 1.75))) clap(t, .18 + .25 * (t - 32) / 1.75);
for (let k = 0; k < 4; k++) blip(36 + k * .9, 300 + k * 80, .03, .08);   // mic ticks in the demo
pad(53.5, 6, CHORDS[0], .11, .02);

// --- mix ----------------------------------------------------------------
// sidechain: duck the music bus after every kick
const duck = new Float32Array(N).fill(1);
for (const [a, b] of TL.kickSections) for (let t = a; t < b - 1e-6; t += BEAT) {
  const s0 = idx(t);
  for (let i = 0; i < SR * BEAT && s0 + i < N; i++) duck[s0 + i] = Math.min(duck[s0 + i], 1 - .7 * Math.exp(-i / SR * 9));
}
for (let i = 0; i < N; i++) { const v = music[i] * duck[i]; L[i] += v; }
// small Schroeder reverb on the send
const combs = [1557, 1617, 1491, 1422].map(d => ({ d, b: new Float32Array(d), i: 0 }));
const aps = [225, 556].map(d => ({ d, b: new Float32Array(d), i: 0 }));
const wetL = new Float32Array(N), wetR = new Float32Array(N);
for (let n = 0; n < N; n++) {
  let x = send[n] * .25, y = 0;
  combs.forEach(c => { const o = c.b[c.i]; c.b[c.i] = x + o * .82; c.i = (c.i + 1) % c.d; y += o; });
  aps.forEach(a => { const o = a.b[a.i], v = -.5 * y + o; a.b[a.i] = y + .5 * v; a.i = (a.i + 1) % a.d; y = v; });
  wetL[n] = y; wetR[n] = n > 300 ? wetL[n - 300] : 0;
}
let peak = 0;
for (let n = 0; n < N; n++) {
  const fade = Math.min(1, n / (SR * .2), (N - n) / (SR * 1.0));
  const t = n / SR;
  const dry = L[n] * (t < 5 ? .6 : t < 12 ? .7 : t < 22 ? .8 : t < 34 ? .9 : t < 47 ? 1.25 : t < 51 ? .75 : 1);
  L[n] = Math.tanh((dry + wetL[n] * .5) * 1.1) * fade;
  R[n] = Math.tanh((dry + wetR[n] * .5) * 1.1) * fade;
  peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n]));
}
const gain = .89 / peak;
const out = Buffer.alloc(44 + N * 4);
out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVEfmt ', 8);
out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24);
out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) {
  out.writeInt16LE(Math.round(clamp1(L[n] * gain) * 32767), 44 + n * 4);
  out.writeInt16LE(Math.round(clamp1(R[n] * gain) * 32767), 46 + n * 4);
}
function clamp1(x) { return x > 1 ? 1 : x < -1 ? -1 : x; }
fs.writeFileSync(process.argv[2] || 'music.wav', out);
console.log('  wrote', process.argv[2] || 'music.wav');
