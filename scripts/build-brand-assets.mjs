// Builds brand assets from app/boolstack-logo-plate.svg. Needs Playwright (not a project dep).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (...p) => path.join(root, ...p);
const BG = '#0F0F0D', FG = '#FFFFFF';
const ALT = 'Boolstack - local-first admin panel for your personal HTML apps';

const require = createRequire('C:/Users/Elcraigo/AppData/Roaming/npm/node_modules/@playwright/cli/package.json');
const { chromium } = require('playwright-core');

const lines = readFileSync(P('app/boolstack-logo-plate.svg'), 'utf8').split(/\r?\n/);
const paths = lines.filter((l) => l.startsWith('<path'));
const wordmark = paths.find((l) => !l.includes('fill="white"')).replace(/fill="[^"]*"/, `fill="${FG}"`);
const dots = paths.filter((l) => l.includes('fill="white"')).map((l) => l.replace('fill="white"', `fill="${FG}"`));
const dotsSvg = dots.join('\n');
const lockupSvg = dotsSvg + '\n' + wordmark;

let browser;
for (const channel of ['chrome', 'msedge']) {
  try { browser = await chromium.launch({ channel }); break; } catch {}
}
if (!browser) throw new Error('no chrome/msedge');
const page = await browser.newPage();

async function bbox(inner) {
  await page.setContent(`<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1024"><g id="g">${inner}</g></svg>`);
  return page.evaluate(() => { const b = document.getElementById('g').getBBox(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
}
const dB = await bbox(dotsSvg);
const lB = await bbox(lockupSvg);
console.log('dots bbox', dB, 'lockup bbox', lB);

const f = (n) => +n.toFixed(2);
const wrap = (b, pad, inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(b.x - pad)} ${f(b.y - pad)} ${f(b.w + 2 * pad)} ${f(b.h + 2 * pad)}" fill="none">\n${inner}\n</svg>\n`;

// Content centred in a W x H canvas, content width = frac * W (or limited by height).
function canvas(W, H, b, inner, frac, { rx = 0, bg = BG } = {}) {
  const s = Math.min((W * frac) / b.w, (H * 0.9) / b.h);
  const tx = W / 2 - (b.x + b.w / 2) * s, ty = H / 2 - (b.y + b.h / 2) * s;
  const bgEl = bg ? `<rect width="${W}" height="${H}" rx="${rx}" fill="${bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">${bgEl}<g transform="translate(${f(tx)} ${f(ty)}) scale(${f(s)})">${inner}</g></svg>`;
}

async function png(svg, W, H) {
  await page.setViewportSize({ width: W, height: H });
  await page.setContent(`<body style="margin:0;background:transparent">${svg}</body>`);
  return page.screenshot({ clip: { x: 0, y: 0, width: W, height: H }, omitBackground: true, type: 'png' });
}
const icon = (S, frac, o) => canvas(S, S, dB, dotsSvg, frac, o);

// SVGs
mkdirSync(P('public/brand'), { recursive: true });
writeFileSync(P('public/brand/boolstack-icon.svg'), wrap(dB, 8, dotsSvg));
writeFileSync(P('public/brand/boolstack-logo.svg'), wrap(lB, 10, lockupSvg));
writeFileSync(P('app/icon.svg'), icon(96, 0.78, { rx: 20 }) + '\n');

// PNGs
const out = (p, buf) => writeFileSync(P(p), buf);
const icon96 = await png(icon(96, 0.78, { rx: 20 }), 96, 96);
out('app/icon.png', icon96);
out('app/apple-icon.png', await png(icon(180, 0.6), 180, 180));
out('public/web-app-manifest-192x192.png', await png(icon(192, 0.6), 192, 192));
out('public/web-app-manifest-512x512.png', await png(icon(512, 0.6), 512, 512));
const og = await png(canvas(1200, 630, lB, lockupSvg, 0.55), 1200, 630);
out('app/opengraph-image.png', og);
out('app/twitter-image.png', og);
writeFileSync(P('app/opengraph-image.alt.txt'), ALT);
writeFileSync(P('app/twitter-image.alt.txt'), ALT);

// ICO (PNG-embedded)
const sizes = [16, 32, 48];
const imgs = [];
for (const s of sizes) imgs.push(await png(icon(s, 0.82, { rx: Math.round(s * 0.2) }), s, s));
const head = Buffer.alloc(6 + 16 * sizes.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
let off = head.length;
sizes.forEach((s, i) => {
  const o = 6 + 16 * i;
  head.writeUInt8(s, o); head.writeUInt8(s, o + 1); head.writeUInt8(0, o + 2); head.writeUInt8(0, o + 3);
  head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6);
  head.writeUInt32LE(imgs[i].length, o + 8); head.writeUInt32LE(off, o + 12);
  off += imgs[i].length;
});
out('app/favicon.ico', Buffer.concat([head, ...imgs]));

await browser.close();
console.log('done');
