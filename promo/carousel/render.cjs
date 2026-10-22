// Screenshots every .slide in carousel.html to a 1080x1350 PNG.
// Usage: NODE_PATH=$(npm root -g) node render.cjs [outdir]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outDir = path.resolve(process.argv[2] || path.join(__dirname, 'slides'));

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, 'carousel.html'));
  await page.evaluate(() => document.fonts.ready);
  const slides = await page.$$('.slide');
  for (let i = 0; i < slides.length; i++) {
    const file = path.join(outDir, `clone_mode_ep01_${String(i + 1).padStart(2, '0')}.png`);
    await slides[i].screenshot({ path: file });
    console.log('  ' + path.relative(process.cwd(), file));
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
