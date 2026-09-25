export type ColorName = "black" | "red" | "pink" | "orange" | "yellow" | "green" | "blue" | "purple";
export type BodyZone = "forearm" | "shoulder" | "back";
export type SkinTone = "light" | "medium" | "deep";
export type Mood = "thrilled" | "happy" | "meh" | "angry";
export type JobMode = "standard" | "coverup" | "free";
export type JobId = "tino-1" | "kaylee-1" | "tino-2" | "self";

export interface Rect { x: number; y: number; w: number; h: number } // normalized 0..1

export interface Job {
  id: JobId;
  night: 1 | 2 | 3;
  mode: JobMode;
  client: { name: string; handle: string; bio: string; initials: string; accent: string };
  request: string;
  motif: string | null;           // plain words the judge checks
  motifOptions?: string[];        // cover-up: any of these counts
  lettering: string | null;
  requiredColors: ColorName[];
  forbiddenColors: ColorName[];
  coverage: { min: number; max: number } | null;
  body: { zone: BodyZone; tone: SkinTone };
  targetZone: Rect | null;
  basePay: number;
  startFrom: "blank" | "tino-1";
  lines: Record<Mood, string>;
  refusal: string;
}

export interface Placement { cx: number; cy: number; scale: number; rotate: number }

export interface JobResult {
  stencil: string;        // raw 1024x1024 editor output data URL (JPEG for opaque stencils). Not normalized; normalize() to 512 only for analysis. Also the cover-up start image.
  composite: string;      // 1000x1250 PNG data URL
  placement: Placement;
  score: number;
  breakdown: Record<string, { got: number; max: number }>;
  stars: 1 | 2 | 3 | 4 | 5;
  mood: Mood;
  reaction: string;
  tip: number;
  source: "vision" | "fallback";
}
