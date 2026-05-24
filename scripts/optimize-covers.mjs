#!/usr/bin/env node
/**
 * Generates responsive WebP variants of cover art so the LCP image
 * isn't a multi-megabyte PNG. Sources: public/covers/*.png
 * Outputs:    public/covers/optimized/<name>-<width>.webp
 *
 * Re-runs only when source is newer than the largest output variant.
 * Wired into `prebuild` so `npm run build` regenerates as needed.
 */
import { readdir, stat, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const COVERS_DIR = path.resolve('public/covers');
const OUT_DIR = path.join(COVERS_DIR, 'optimized');
const WIDTHS = [240, 320, 480, 640, 960];
const QUALITY = 78;

async function isUpToDate(src, outputs) {
  const srcStat = await stat(src);
  for (const out of outputs) {
    if (!existsSync(out)) return false;
    const outStat = await stat(out);
    if (outStat.mtimeMs < srcStat.mtimeMs) return false;
  }
  return true;
}

async function processOne(file) {
  const srcPath = path.join(COVERS_DIR, file);
  const base = path.parse(file).name;
  const outputs = WIDTHS.map((w) => path.join(OUT_DIR, `${base}-${w}.webp`));

  if (await isUpToDate(srcPath, outputs)) {
    return { file, skipped: true };
  }

  const pipeline = sharp(srcPath);
  const meta = await pipeline.metadata();

  await Promise.all(
    WIDTHS.map((w) => {
      const target = path.join(OUT_DIR, `${base}-${w}.webp`);
      const resize = meta.width && meta.width <= w ? null : w;
      return sharp(srcPath)
        .resize(resize ? { width: resize, withoutEnlargement: true } : undefined)
        .webp({ quality: QUALITY, effort: 5 })
        .toFile(target);
    }),
  );

  return { file, skipped: false };
}

async function main() {
  if (!existsSync(COVERS_DIR)) {
    console.warn(`[optimize-covers] No covers dir at ${COVERS_DIR}, skipping.`);
    return;
  }
  await mkdir(OUT_DIR, { recursive: true });
  const entries = await readdir(COVERS_DIR);
  const pngs = entries.filter((f) => f.toLowerCase().endsWith('.png'));
  if (pngs.length === 0) {
    console.warn('[optimize-covers] No PNG covers found.');
    return;
  }
  const results = await Promise.all(pngs.map(processOne));
  const made = results.filter((r) => !r.skipped).length;
  const skipped = results.length - made;
  console.log(`[optimize-covers] Generated WebP for ${made} cover(s), ${skipped} up-to-date.`);
}

main().catch((err) => {
  console.error('[optimize-covers] Failed:', err);
  process.exit(1);
});
