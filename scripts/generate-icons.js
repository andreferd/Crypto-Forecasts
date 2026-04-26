/* eslint-disable */
// Generate app icons for crypto-forecasts.
// Concept: a centered probability histogram — 5 bars rising/falling symmetrically,
// evoking a probability distribution. Accent blue on warm-dark background.
// Run: node scripts/generate-icons.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BG = '#0E0F11';
const ACCENT = '#8AB4F8';
const ACCENT_SOFT = '#B8D2FF';

const SIZE = 1024;
const CORNER = 220;

const BARS = [
  { h: 260, fill: ACCENT },
  { h: 420, fill: ACCENT },
  { h: 560, fill: ACCENT_SOFT },
  { h: 420, fill: ACCENT },
  { h: 260, fill: ACCENT },
];
const BAR_WIDTH = 120;
const GAP = 36;
const BASELINE_Y = 780;

function renderBars() {
  const totalWidth = BARS.length * BAR_WIDTH + (BARS.length - 1) * GAP;
  const startX = (SIZE - totalWidth) / 2;
  return BARS.map((b, i) => {
    const x = startX + i * (BAR_WIDTH + GAP);
    const y = BASELINE_Y - b.h;
    const rx = 28;
    return `<rect x="${x}" y="${y}" width="${BAR_WIDTH}" height="${b.h}" rx="${rx}" fill="${b.fill}"/>`;
  }).join('');
}

function renderBaseline() {
  const startX = 160;
  const endX = SIZE - 160;
  return `<line x1="${startX}" y1="${BASELINE_Y + 30}" x2="${endX}" y2="${BASELINE_Y + 30}" stroke="${ACCENT}" stroke-width="6" stroke-linecap="round" opacity="0.35"/>`;
}

// Full icon (opaque, rounded bg) — for iOS / favicon / app.json icon.png
const iconSvg = () => `
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${SIZE}" height="${SIZE}" rx="${CORNER}" fill="${BG}"/>
  ${renderBars()}
  ${renderBaseline()}
</svg>`;

// Android launcher (circle-masked by system but we fill square) — opaque dark bg
const launcherSvg = () => `
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${SIZE}" height="${SIZE}" fill="${BG}"/>
  ${renderBars()}
  ${renderBaseline()}
</svg>`;

// Adaptive icon foreground: transparent bg, bars scaled to fit Android's 66% safe zone
const safeZoneScale = 0.66;
const fgInset = Math.round((SIZE * (1 - safeZoneScale)) / 2);
const adaptiveForegroundSvg = () => `
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(${fgInset}, ${fgInset}) scale(${safeZoneScale})">
    ${renderBars()}
    ${renderBaseline()}
  </g>
</svg>`;

// Splash: dark bg with a smaller centered mark
const splashSize = 1200;
const splashSvg = () => `
<svg width="${splashSize}" height="${splashSize}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${SIZE}" height="${SIZE}" fill="${BG}"/>
  <g transform="translate(${SIZE * 0.2}, ${SIZE * 0.2}) scale(0.6)">
    ${renderBars()}
    ${renderBaseline()}
  </g>
</svg>`;

const root = path.join(__dirname, '..');
const assetsDir = path.join(root, 'assets');
const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res');

const mipmapSizes = {
  'mipmap-mdpi': { launcher: 48, foreground: 108 },
  'mipmap-hdpi': { launcher: 72, foreground: 162 },
  'mipmap-xhdpi': { launcher: 96, foreground: 216 },
  'mipmap-xxhdpi': { launcher: 144, foreground: 324 },
  'mipmap-xxxhdpi': { launcher: 192, foreground: 432 },
};

async function run() {
  // app.json assets
  await sharp(Buffer.from(iconSvg())).resize(SIZE, SIZE).png().toFile(path.join(assetsDir, 'icon.png'));
  await sharp(Buffer.from(adaptiveForegroundSvg())).resize(SIZE, SIZE).png().toFile(path.join(assetsDir, 'adaptive-icon.png'));
  await sharp(Buffer.from(splashSvg())).resize(splashSize, splashSize).png().toFile(path.join(assetsDir, 'splash.png'));
  await sharp(Buffer.from(iconSvg())).resize(48, 48).png().toFile(path.join(assetsDir, 'favicon.png'));

  // Native Android mipmap icons (webp — what Expo's template expects)
  for (const [dir, { launcher, foreground }] of Object.entries(mipmapSizes)) {
    const dest = path.join(androidRes, dir);
    if (!fs.existsSync(dest)) continue;

    await sharp(Buffer.from(launcherSvg()))
      .resize(launcher, launcher)
      .webp({ quality: 100 })
      .toFile(path.join(dest, 'ic_launcher.webp'));

    await sharp(Buffer.from(launcherSvg()))
      .resize(launcher, launcher)
      .webp({ quality: 100 })
      .toFile(path.join(dest, 'ic_launcher_round.webp'));

    await sharp(Buffer.from(adaptiveForegroundSvg()))
      .resize(foreground, foreground)
      .webp({ quality: 100 })
      .toFile(path.join(dest, 'ic_launcher_foreground.webp'));
  }

  console.log('Icons written to assets/ and android/app/src/main/res/mipmap-*');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
