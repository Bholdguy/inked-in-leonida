// PRD 11.4 share card: 1080x1350 PNG. Browser only.
import { loadImage, makeCanvas } from "@/lib/ink/dom";
import { wrapLines } from "./social";

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

export interface CardInput {
  composite: string; // 1000x1250 composite data URL
  handle: string;
  stars: number | null; // null for the finale
  caption: string;
}

// next/font exposes the generated family names as CSS variables on <body>.
function fontFamily(variable: string, fallback: string): string {
  const name = getComputedStyle(document.body).getPropertyValue(variable).trim();
  return name ? `${name}, ${fallback}` : fallback;
}

export async function renderShareCard({ composite, handle, stars, caption }: CardInput): Promise<Blob> {
  await document.fonts?.ready;
  const display = fontFamily("--font-syne", "Arial, sans-serif");
  const body = fontFamily("--font-space-grotesk", "Arial, sans-serif");
  const img = await loadImage(composite);

  const canvas = makeCanvas(CARD_WIDTH, CARD_HEIGHT);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available");

  // Night background with a pink haze and a sunset glow.
  ctx.fillStyle = "#0b0714";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  const haze = ctx.createRadialGradient(160, 0, 0, 160, 0, 900);
  haze.addColorStop(0, "rgba(255,62,154,0.35)");
  haze.addColorStop(1, "rgba(255,62,154,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  const glow = ctx.createRadialGradient(540, 1450, 0, 540, 1450, 900);
  glow.addColorStop(0, "rgba(255,138,61,0.45)");
  glow.addColorStop(1, "rgba(255,138,61,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Composite: 1000x1000 center crop, framed.
  const x = 40, y = 40, size = 1000;
  const crop = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - crop) / 2, sy = (img.naturalHeight - crop) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, 28);
  ctx.clip();
  const bg = ctx.createRadialGradient(540, 300, 0, 540, 300, 700);
  bg.addColorStop(0, "#241838");
  bg.addColorStop(1, "#0b0714");
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, size, size);
  ctx.drawImage(img, sx, sy, crop, crop, x, y, size, size);
  ctx.restore();
  ctx.strokeStyle = "rgba(255,62,154,0.8)";
  ctx.lineWidth = 3;
  ctx.shadowColor = "#ff3e9a";
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, 28);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Handle and stars.
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f4ede4";
  ctx.font = `700 40px ${display}`;
  ctx.fillText(handle, 48, 1112);
  if (stars) {
    ctx.font = `700 40px ${body}`;
    ctx.textAlign = "right";
    ctx.fillStyle = "#ff8a3d";
    ctx.fillText("★".repeat(stars) + "☆".repeat(5 - stars), CARD_WIDTH - 48, 1112);
    ctx.textAlign = "left";
  }

  // Caption, two lines max.
  ctx.fillStyle = "rgba(244,237,228,0.92)";
  ctx.font = `500 36px ${body}`;
  const lines = wrapLines(`“${caption}”`, CARD_WIDTH - 96, (s) => ctx.measureText(s).width);
  lines.forEach((line, i) => ctx.fillText(line, 48, 1172 + i * 48));

  // Footer.
  ctx.fillStyle = "#19e3d1";
  ctx.font = `800 26px ${display}`;
  ctx.shadowColor = "#19e3d1";
  ctx.shadowBlur = 12;
  ctx.fillText("INKED IN LEONIDA · #BuiltWithImageEditor", 48, 1306);
  ctx.shadowBlur = 0;

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the card"))), "image/png"),
  );
}

/** Download via an anchor with `download` and a blob URL (PRD 11.4). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
