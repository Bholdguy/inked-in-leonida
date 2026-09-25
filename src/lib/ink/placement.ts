import type { Rect } from "@/types";

// Normalized center point (0..1) inside the zone rect, edges inclusive.
export function placementHit(center: { x: number; y: number }, zone: Rect): boolean {
  return center.x >= zone.x && center.x <= zone.x + zone.w && center.y >= zone.y && center.y <= zone.y + zone.h;
}
