// Sound preference (PRD 11.5): off unless the player turned it on. Storage failures are ignored.
export const SOUND_KEY = "inked-in-leonida:sound:v1";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function storage(explicit?: StorageLike | null): StorageLike | null {
  if (explicit !== undefined) return explicit;
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadSound(store?: StorageLike | null): boolean {
  try {
    return storage(store)?.getItem(SOUND_KEY) === "on";
  } catch {
    return false;
  }
}

export function saveSound(on: boolean, store?: StorageLike | null): void {
  try {
    storage(store)?.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    /* private window or blocked storage: the toggle still works for this visit */
  }
}
