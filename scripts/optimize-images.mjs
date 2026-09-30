#!/usr/bin/env node
/*
 * Resize + compress source images for the site, using the Chromium that
 * Playwright provides (no image libraries needed).
 *   node scripts/optimize-images.mjs <source-image> <output-base>
 *   e.g. node scripts/optimize-images.mjs incoming/dominoes.png illus-dominoes
 * Writes public/img/<output-base>-{800,1280}.{webp,jpg} at quality ~80.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , src, base] = process.argv;
if (!src || !base) { console.error('Usage: node scripts/optimize-images.mjs <source-image> <output-base>'); process.exit(1); }
const { chromium } = await import(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }[extname(src).toLowerCase()];
const dataUrl = `data:${mime};base64,${readFileSync(src).toString('base64')}`;

const browser = await chromium.launch();
const page = await browser.newPage();
const out = await page.evaluate(async ({ dataUrl, widths }) => {
  const img = new Image(); img.src = dataUrl; await img.decode();
  const res = {};
  for (const w of widths) {
    const h = Math.round(img.naturalHeight * w / img.naturalWidth);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, w, h);
    res[w] = { webp: c.toDataURL('image/webp', 0.8), jpg: c.toDataURL('image/jpeg', 0.8), h };
  }
  return { res, nw: img.naturalWidth, nh: img.naturalHeight };
}, { dataUrl, widths: [800, 1280] });
await browser.close();

for (const [w, r] of Object.entries(out.res)) {
  for (const ext of ['webp', 'jpg']) {
    const file = join(root, 'public/img', `${base}-${w}.${ext}`);
    writeFileSync(file, Buffer.from(r[ext].split(',')[1], 'base64'));
    console.log(`${file}  ${w}x${r.h}`);
  }
}
console.log(`Source was ${out.nw}x${out.nh}. Now run: node scripts/render-content.mjs`);
