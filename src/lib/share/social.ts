// Pure helpers for INKGRAM and sharing (PRD 8.2, 11.4). No DOM here.

// FNV-1a: a small stable hash so "random" numbers are the same every visit for a job.
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** PRD 8.2: stars * a random 180-420, seeded by the job id so it is stable. */
export function likeCount(jobId: string, stars: number): number {
  return stars * (180 + (hashString(jobId) % 241));
}

export function formatLikes(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : String(n);
}

/** PRD 11.4 share text. `client` null = the finale (you inked yourself). */
export function shareText(client: string | null, stars: number | null, url: string): string {
  const who = client ?? "myself";
  const rating = stars ? ` ${stars}★` : "";
  return `I just inked ${who} at a Leonida tattoo shop.${rating} ${url} #BuiltWithImageEditor @unlayer`;
}

export function xIntentUrl(text: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
}

/**
 * Greedy word wrap with a caller-supplied measure (canvas measureText in the browser).
 * At most `maxLines`; the last line ends in an ellipsis if text was cut.
 */
export function wrapLines(text: string, maxWidth: number, measure: (s: string) => number, maxLines = 2): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  let i = 0;
  for (; i < words.length; i++) {
    const next = line ? `${line} ${words[i]}` : words[i];
    if (measure(next) <= maxWidth || !line) {
      line = next;
      continue;
    }
    lines.push(line);
    line = words[i];
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && line) {
    lines.push(line);
    line = "";
    i = words.length;
  }
  if (i < words.length || line) {
    let last = lines[lines.length - 1];
    while (last && measure(`${last}…`) > maxWidth) last = last.slice(0, -1).trimEnd();
    lines[lines.length - 1] = `${last}…`;
  }
  return lines;
}
