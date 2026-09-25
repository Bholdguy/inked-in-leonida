import type { BodyZone, Rect, SkinTone } from "@/types";

// Single source for body art. Placeholders live at these paths; real art is a file replace.
export const BODY_SOURCES: Partial<Record<`${BodyZone}-${SkinTone}`, string>> = {
  "forearm-light": "/bodies/forearm-light.png",
  "forearm-medium": "/bodies/forearm-medium.png",
  "forearm-deep": "/bodies/forearm-deep.png",
  "shoulder-light": "/bodies/shoulder-light.png",
  "back-light": "/bodies/back-light.png",
  "back-medium": "/bodies/back-medium.png",
  "back-deep": "/bodies/back-deep.png",
};

export function bodySrc(zone: BodyZone, tone: SkinTone): string {
  const src = BODY_SOURCES[`${zone}-${tone}`];
  if (!src) throw new Error(`No body art for ${zone}-${tone}`);
  return src;
}

// Body art is 1000x1250 (4:5). The composite uses the same size.
export const BODY_WIDTH = 1000;
export const BODY_HEIGHT = 1250;

export const TARGET_ZONES = {
  forearm: { rect: { x: 0.3, y: 0.35, w: 0.4, h: 0.35 }, label: "Inside left forearm" },
  shoulder: { rect: { x: 0.25, y: 0.2, w: 0.45, h: 0.4 }, label: "Left shoulder" },
} satisfies Partial<Record<BodyZone, { rect: Rect; label: string }>>;

export const SKIN_HEX: Record<SkinTone, string> = {
  light: "#E8C3A0",
  medium: "#B98260",
  deep: "#6B4430",
};
