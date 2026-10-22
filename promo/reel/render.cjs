// Renders scene.html frame-by-frame with headless Chromium and pipes the
// frames into ffmpeg, split across parallel workers.
// Usage: node render.cjs <outdir> [--workers N] [--stills t1,t2,...]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const outDir = path.resolve(args[0] || 'out');
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const workers = parseInt(opt('--workers', '4'), 10);
const stills = opt('--stills', null);
const sceneUrl = 'file://' + path.join(__dirname, 'scene.html') + '?render=1';

require(path.join(__dirname, 'timeline.js'));
const { fps, duration } = globalThis.TL;
const total = Math.round(fps * duration);

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto(sceneUrl);
  await page.evaluate(() => document.fonts.ready);
  return page;
}
const grab = (page, t) => page.evaluate(t => {
  renderFrame(t);
  return document.getElementById('c').toDataURL('image/png');
}, t).then(url => Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));

async function renderSegment(browser, k, from, to) {
  const page = await openPage(browser);
  const file = path.join(outDir, `seg_${k}.mp4`);
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps),
    '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '10', '-pix_fmt', 'yuv420p', file],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', c => c ? rej(new Error('ffmpeg ' + c)) : res()));
  for (let f = from; f < to; f++) {
    const png = await grab(page, f / fps);
    if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
    if (k === 0 && f % 30 === 0) process.stdout.write(`\r  frame ${f - from}/${to - from} (worker 0)`);
  }
  ff.stdin.end();
  await done;
  return file;
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  if (stills) {
    const page = await openPage(browser);
    for (const t of stills.split(',').map(Number)) {
      fs.writeFileSync(path.join(outDir, `still_${t.toFixed(2)}.png`), await grab(page, t));
    }
    await browser.close();
    return;
  }
  const per = Math.ceil(total / workers);
  const files = await Promise.all([...Array(workers)].map((_, k) =>
    renderSegment(browser, k, k * per, Math.min(total, (k + 1) * per))));
  fs.writeFileSync(path.join(outDir, 'segments.txt'), files.map(f => `file '${f}'`).join('\n') + '\n');

  await browser.close();
  console.log(`\n  rendered ${total} frames`);
})().catch(e => { console.error(e); process.exit(1); });
