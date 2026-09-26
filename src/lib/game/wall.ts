// The shop wall that survives a reload. Every storage call is guarded: private windows, blocked
// storage, a full quota or a corrupt entry all mean "no saved wall", never a crash.
import type { JobId } from "@/types";

export const WALL_KEY = "inked-in-leonida:wall:v1";

export interface WallPiece {
  jobId: JobId;
  name: string;
  handle: string;
  stars: number | null; // null for the unscored finale
  tip: number;
  thumb: string; // small JPEG data URL of the composite
}

export interface SavedWall {
  pieces: WallPiece[];
  totalTips: number;
  rating: number | null;
  savedAt: number;
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;

// Even reading `window.localStorage` can throw (SecurityError when storage is blocked).
function storage(explicit?: StorageLike | null): StorageLike | null {
  if (explicit !== undefined) return explicit;
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function saveWall(wall: SavedWall, store?: StorageLike | null): boolean {
  try {
    const s = storage(store);
    if (!s) return false;
    s.setItem(WALL_KEY, JSON.stringify(wall));
    return true;
  } catch {
    return false;
  }
}

export function loadWall(store?: StorageLike | null): SavedWall | null {
  try {
    const raw = storage(store)?.getItem(WALL_KEY);
    if (!raw) return null;
    const wall = JSON.parse(raw) as SavedWall;
    if (!Array.isArray(wall?.pieces) || typeof wall.totalTips !== "number") return null;
    const pieces = wall.pieces.filter(
      (p) => typeof p?.thumb === "string" && p.thumb.startsWith("data:image/") && typeof p.name === "string",
    );
    return pieces.length ? { ...wall, pieces } : null;
  } catch {
    return null;
  }
}
