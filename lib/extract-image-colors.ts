/**
 * Extracts dominant colors from an image URL using canvas.
 * Intended for browser use (Image, canvas, getImageData).
 */

const MAX_COLORS = 7;
const QUANTIZE_BITS = 5; // 32 levels per channel for finer color separation
const SAMPLE_STEP = 1; // sample every pixel so small regions (e.g. gold) aren't undercounted
const CANVAS_MAX_SIZE = 280; // larger canvas for better coverage of smaller colored areas
/** First N slots are always the top N by dominance (score); rest are filled for diversity. */
const DOMINANT_SLOTS = 4;

function rgbToHex(r: number, g: number, b: number): string {
  const hr = Math.round(r).toString(16).padStart(2, "0");
  const hg = Math.round(g).toString(16).padStart(2, "0");
  const hb = Math.round(b).toString(16).padStart(2, "0");
  return `#${hr}${hg}${hb}`.toUpperCase();
}

/** Saturation 0–1: 0 = gray, 1 = pure color. */
function saturation(r: number, g: number, b: number): number {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  if (max === 0) return 0;
  return max === min ? 0 : (max - min) / max;
}

/** Normalized RGB distance 0–1 (1 = max difference). */
function colorDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  const d = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
  return Math.min(1, d / 441.67);
}

type ColorEntry = { r: number; g: number; b: number; count: number; sat: number; score: number };

export async function extractImageColors(imageUrl: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onerror = () => {
      resolve([]);
    };

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > height) {
          if (width > CANVAS_MAX_SIZE) {
            height = (height * CANVAS_MAX_SIZE) / width;
            width = CANVAS_MAX_SIZE;
          }
        } else {
          if (height > CANVAS_MAX_SIZE) {
            width = (width * CANVAS_MAX_SIZE) / height;
            height = CANVAS_MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve([]);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const shift = 8 - QUANTIZE_BITS;
        const bucketCounts = new Map<
          string,
          { sumR: number; sumG: number; sumB: number; count: number }
        >();

        for (let i = 0; i < data.length; i += SAMPLE_STEP * 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 128) continue;
          const qr = r >> shift;
          const qg = g >> shift;
          const qb = b >> shift;
          const key = `${qr},${qg},${qb}`;
          const existing = bucketCounts.get(key);
          if (existing) {
            existing.sumR += r;
            existing.sumG += g;
            existing.sumB += b;
            existing.count += 1;
          } else {
            bucketCounts.set(key, { sumR: r, sumG: g, sumB: b, count: 1 });
          }
        }

        const entries: ColorEntry[] = Array.from(bucketCounts.entries()).map(
          ([, v]) => {
            const { sumR, sumG, sumB, count } = v;
            const r = sumR / count;
            const g = sumG / count;
            const b = sumB / count;
            const sat = saturation(r, g, b);
            return { r, g, b, count, sat, score: count * (1 + 5 * sat) };
          }
        );

        entries.sort((a, b) => b.score - a.score);

        // 1) Reserve first DOMINANT_SLOTS for the top colors by score so main colors are never skipped
        const selected: ColorEntry[] = entries.slice(0, Math.min(DOMINANT_SLOTS, entries.length));
        const used = new Set(selected);
        const remaining = entries.filter((e) => !used.has(e));

        // 2) Fill remaining slots with diversity-aware picks so we add distinct accents
        while (selected.length < MAX_COLORS && remaining.length > 0) {
          let bestIdx = 0;
          let bestValue = -1;
          for (let i = 0; i < remaining.length; i++) {
            const c = remaining[i];
            const minDist = Math.min(
              ...selected.map((s) => colorDistance(c.r, c.g, c.b, s.r, s.g, s.b))
            );
            const diversityBonus = 0.3 + 0.7 * minDist;
            const value = c.score * diversityBonus;
            if (value > bestValue) {
              bestValue = value;
              bestIdx = i;
            }
          }
          selected.push(remaining[bestIdx]);
          remaining.splice(bestIdx, 1);
        }

        const colors = selected.map((e) => rgbToHex(e.r, e.g, e.b));

        resolve(colors);
      } catch {
        resolve([]);
      }
    };

    img.src = imageUrl;
  });
}
