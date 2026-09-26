import type { Job } from "@/types";

// PRD 11.3 vision prompt, brackets filled from server-side job data only.
export function buildSystemPrompt(job: Job, opts: { hasStencil: boolean; oldLettering: string | null }): string {
  const intro = opts.hasStencil
    ? [
        "You are judging a tattoo in a comedy tattoo-parlor game. You get two images.",
        "Image 1 is the STENCIL: the design exactly as the artist drew it, on white paper. Judge the motif and the lettering from the STENCIL.",
        "Image 2 is the TATTOO ON SKIN: the same design inked on the client. React to the TATTOO ON SKIN.",
      ]
    : ["You are judging a tattoo in a comedy tattoo-parlor game. You see a tattoo on skin."];

  const lines = [
    ...intro,
    `Client: ${job.client.name}. Personality: ${job.client.bio} They ordered: motif "${job.motif ?? "anything"}", lettering "${job.lettering ?? "none"}", on their ${job.body.zone}.`,
  ];
  if (job.mode === "coverup" && opts.oldLettering) {
    lines.push(`This is a cover-up. The old tattoo said "${opts.oldLettering}". Report whether that old word is still readable.`);
  }
  lines.push(
    "Return ONLY JSON with keys:",
    "motifMatch (boolean: is the ordered motif, or something clearly meant as it, present? Be generous with rough drawings),",
    "letteringFound (string of any readable text, or null),",
    "letteringMatch (boolean: does readable text match the ordered lettering, ignoring case and small typos?),",
    "oldTextReadable (boolean or null),",
    "offensive (boolean: slurs, hate symbols, sexual content, or graphic gore),",
    "reaction (one short line, max 20 words, in the client's voice, funny, PG-13, no slurs, reacting to THIS tattoo),",
    "mood (one of: thrilled, happy, meh, angry).",
  );
  return lines.join("\n");
}

// Constrains the model's output shape. Every field is still validated by hand (validate.ts).
export const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    motifMatch: { type: "BOOLEAN" },
    letteringFound: { type: "STRING", nullable: true },
    letteringMatch: { type: "BOOLEAN" },
    oldTextReadable: { type: "BOOLEAN", nullable: true },
    offensive: { type: "BOOLEAN" },
    reaction: { type: "STRING" },
    mood: { type: "STRING", enum: ["thrilled", "happy", "meh", "angry"] },
  },
  required: ["motifMatch", "letteringFound", "letteringMatch", "oldTextReadable", "offensive", "reaction", "mood"],
} as const;
