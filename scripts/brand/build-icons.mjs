/**
 * npm run brand:icons — generates every BugTrail logo file from one place:
 *   src/app/icon.svg, src/app/favicon.ico, src/app/apple-icon.png   (Next.js picks these up)
 *   public/assets/*                                                 (static files to share, served at /assets/...)
 *
 * The in-app logo is inline code (src/components/shared/logo.tsx) so it follows light/dark
 * through currentColor. If you change the mark there, change MARK below the same way and rerun.
 * Output is deterministic: running it twice gives identical files.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = (...parts) => path.join(root, ...parts);

/** The two brand colours: the light theme's ink and page ground (src/app/globals.css). */
const INK = '#1d1e1c';
const PAPER = '#efeeea';
/** The dark theme's ink, for the mark on dark backgrounds. */
const INK_ON_DARK = '#e8e7e1';

/* ------------------------------------------------------------------ the 40×20 mark */

/**
 * The same trail as logo.tsx: a line, four stations, one loop back. For a transparent file
 * the rings must be truly hollow, so the line stops at each ring and the loop ends at the
 * ring's edge (in the app, the rings are filled with the page colour instead).
 */
function markShapes(color) {
  const ring = 2.6; // ring radius; its 1.6 stroke is centred on it
  const y = 14;
  return [
    // line segments between stations, stopping at the hollow rings at x=14 and x=26
    `<path d="M4 ${y}H${14 - ring}M${14 + ring} ${y}H${26 - ring}M${26 + ring} ${y}H36" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`,
    `<path d="M26 ${y - ring}C26 4 14 4 14 ${y - ring}" fill="none" stroke="${color}" stroke-width="1.6"/>`,
    `<circle cx="4" cy="${y}" r="2.6" fill="${color}"/>`,
    `<circle cx="14" cy="${y}" r="${ring}" fill="none" stroke="${color}" stroke-width="1.6"/>`,
    `<circle cx="26" cy="${y}" r="${ring}" fill="none" stroke="${color}" stroke-width="1.6"/>`,
    `<circle cx="36" cy="${y}" r="3.2" fill="${color}"/>`,
  ].join('');
}

const svg = (width, height, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;

const markSvg = (color) => svg(40, 20, markShapes(color), 'BugTrail');

/* ------------------------------------------------------------------ mark + wordmark */

/**
 * "BugTrail" as outlines (no font needed to view it), set like the app: Instrument Sans
 * SemiBold, 16px, tracking -0.025em, 8px after the mark, both centred on a 24px line.
 */
async function logoSvg(color) {
  const fontFile = await readFile(out('scripts/brand/fonts/InstrumentSans-SemiBold-latin.woff'));
  const font = opentype.parse(
    fontFile.buffer.slice(fontFile.byteOffset, fontFile.byteOffset + fontFile.byteLength),
  );
  const size = 16;
  const lineHeight = 24;
  const scale = size / font.unitsPerEm;
  const tracking = -0.025 * size;
  const ascent = font.ascender * scale;
  const descent = -font.descender * scale;
  // CSS centres the font's content box (ascent + descent) in the line box.
  const baseline = (lineHeight - (ascent + descent)) / 2 + ascent;

  const textX = 40 + 8;
  let x = textX;
  const glyphs = font.stringToGlyphs('BugTrail');
  const paths = glyphs.map((glyph, i) => {
    const d = glyph.getPath(x, baseline, size).toPathData(2);
    const next = glyphs[i + 1];
    const kern = next ? font.getKerningValue(glyph, next) * scale : 0;
    x += glyph.advanceWidth * scale + kern + (next ? tracking : 0);
    return d;
  });
  const width = Math.ceil(x * 100) / 100;

  const body =
    `<g transform="translate(0 ${(lineHeight - 20) / 2})">${markShapes(color)}</g>` +
    `<path d="${paths.join('')}" fill="${color}"/>`;
  return svg(width, lineHeight, body, 'BugTrail');
}

/* ------------------------------------------------------------------ the square icon */

/**
 * The favicon / app icon: the trail in PAPER on an INK rounded square. Redrawn for small
 * sizes (thicker strokes, bigger stations, a taller loop) so it still reads at 16px.
 * The tile is opaque, so the rings are filled with INK and the line can run straight through.
 */
// Stations keep the mark's spacing (0, 10, 22, 32 of 32) over x 5–27, with gaps wide enough
// for the line to show between them even at 16px.
const ICON_BODY = [
  `<rect width="32" height="32" rx="7" fill="${INK}"/>`,
  `<path d="M5 19H27" stroke="${PAPER}" stroke-width="2.2" stroke-linecap="round"/>`,
  `<path d="M20.1 17C20.1 9.5 11.9 9.5 11.9 17" fill="none" stroke="${PAPER}" stroke-width="2"/>`,
  `<circle cx="5" cy="19" r="2.3" fill="${PAPER}"/>`,
  `<circle cx="11.9" cy="19" r="2" fill="${INK}" stroke="${PAPER}" stroke-width="1.9"/>`,
  `<circle cx="20.1" cy="19" r="2" fill="${INK}" stroke="${PAPER}" stroke-width="1.9"/>`,
  `<circle cx="27" cy="19" r="2.9" fill="${PAPER}"/>`,
].join('');
const iconSvg = svg(32, 32, ICON_BODY, 'BugTrail');

/**
 * The 16px frame of favicon.ico only: at 16px a 1px ring hole blurs into a grey blob, so the
 * two middle stations are solid (the standard trick: simplify the smallest size).
 */
const iconSmallSvg = svg(
  32,
  32,
  ICON_BODY.replaceAll(
    `fill="${INK}" stroke="${PAPER}" stroke-width="1.9"`,
    `fill="${PAPER}"`,
  ).replaceAll('r="2" fill', 'r="2.4" fill'),
  'BugTrail',
);

const png = (svgText, size) =>
  sharp(Buffer.from(svgText), { density: Math.ceil((72 * size) / 32) * 2 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();

/**
 * An .ico is a 6-byte header, a 16-byte entry per image, then the images. Modern ICO
 * readers (Windows Vista+, every browser) accept PNG images inside, so no BMP encoding.
 */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 means 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette colours
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map(({ data }) => data)]);
}

/* ------------------------------------------------------------------ write everything */

async function write(relativePath, content) {
  const file = out(relativePath);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content);
  console.log(`  ${relativePath}`);
}

console.log('BugTrail brand files:');
// Next.js file-convention icons (it adds the <link> tags itself).
await write('src/app/icon.svg', iconSvg);
await write(
  'src/app/favicon.ico',
  ico(
    await Promise.all(
      [16, 32, 48].map(async (size) => ({
        size,
        data: await png(size === 16 ? iconSmallSvg : iconSvg, size),
      })),
    ),
  ),
);
await write('src/app/apple-icon.png', await png(iconSvg, 180));

// Files to share.
await write('public/assets/bugtrail-mark.svg', markSvg(INK));
await write('public/assets/bugtrail-mark-light.svg', markSvg(INK_ON_DARK));
await write('public/assets/bugtrail-logo.svg', await logoSvg(INK));
await write('public/assets/bugtrail-logo-light.svg', await logoSvg(INK_ON_DARK));
await write('public/assets/bugtrail-icon.svg', iconSvg);
await write('public/assets/bugtrail-icon-512.png', await png(iconSvg, 512));
