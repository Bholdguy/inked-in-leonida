import type { Job, JobId } from "@/types";
import { TARGET_ZONES } from "@/data/bodies";

const tino = {
  name: "Tino Batista",
  handle: "@tino.fixes.boats",
  initials: "TB",
  accent: "#FF3E9A",
};

export const JOBS: Job[] = [
  {
    id: "tino-1",
    night: 1,
    mode: "standard",
    client: { ...tino, bio: "Boat mechanic at the marina. Got engaged an hour ago." },
    request:
      "Her name. CRYSTAL. Inside a heart. Red and black, like an old sailor tattoo. Inside of my forearm so I see it every day.",
    motif: "heart",
    lettering: "CRYSTAL",
    requiredColors: ["red", "black"],
    forbiddenColors: [],
    coverage: { min: 0.08, max: 0.4 },
    body: { zone: "forearm", tone: "deep" },
    targetZone: TARGET_ZONES.forearm.rect,
    basePay: 180,
    startFrom: "blank",
    lines: {
      thrilled: "Bro. She's gonna cry. I'm gonna cry. Nobody look at me.",
      happy: "That's clean. Real clean. Crystal's gonna love it.",
      meh: "It's got her name. Probably. Let's go with probably.",
      angry: "My cousin did better at a pool party with a sewing needle.",
    },
    refusal: "Nah. My future mother-in-law is gonna see this. Start over.",
  },
  {
    id: "kaylee-1",
    night: 1,
    mode: "standard",
    client: {
      name: "Kaylee Kash",
      handle: "@kayleekash",
      bio: "212K followers. Allegedly. Needs content by sunrise.",
      initials: "KK",
      accent: "#19E3D1",
    },
    request:
      "Something that screams Leonida. Palm tree, sunset, pink and orange. Put STAY LOUD under it. Shoulder. It has to pop on camera.",
    motif: "palm tree with a sunset",
    lettering: "STAY LOUD",
    requiredColors: ["pink", "orange"],
    forbiddenColors: [],
    coverage: { min: 0.1, max: 0.45 },
    body: { zone: "shoulder", tone: "light" },
    targetZone: TARGET_ZONES.shoulder.rect,
    basePay: 250,
    startFrom: "blank",
    lines: {
      thrilled: "This is going straight to the grid. You're getting tagged.",
      happy: "Cute! The lighting is helping, but I'll take it.",
      meh: "It's giving... effort. I'll crop it.",
      angry: "I can't post this. I have a brand. You have a problem.",
    },
    refusal: "I literally cannot post that. Try again.",
  },
  {
    id: "tino-2",
    night: 2,
    mode: "coverup",
    client: { ...tino, bio: "Back. Not engaged anymore." },
    request:
      "Crystal took the boat. And the dog. Make that name disappear. Put something tough over it. Panther, skull, a storm, I don't care. Dark.",
    motif: "a panther, a skull, or a storm",
    motifOptions: ["panther", "skull", "storm", "lightning"],
    lettering: null,
    requiredColors: ["black"],
    forbiddenColors: [],
    coverage: null,
    body: { zone: "forearm", tone: "deep" },
    targetZone: TARGET_ZONES.forearm.rect,
    basePay: 300,
    startFrom: "tino-1",
    lines: {
      thrilled: "Crystal who? Never heard of her.",
      happy: "Can't see a thing. Good. Moving on with my life.",
      meh: "I can still kinda see a C. The C haunts me.",
      angry: "It still says CRYSTAL. You basically underlined it.",
    },
    refusal: "I'm heartbroken, not crazy. Start over.",
  },
  {
    id: "self",
    night: 3,
    mode: "free",
    client: { name: "You", handle: "@nightshift", bio: "Shop's empty. Last chair's yours.", initials: "ME", accent: "#FF8A3D" },
    request: "Anything you want.",
    motif: null,
    lettering: null,
    requiredColors: [],
    forbiddenColors: [],
    coverage: null,
    body: { zone: "forearm", tone: "deep" }, // replaced by the SELF_SETUP choice
    targetZone: null,
    basePay: 0,
    startFrom: "blank",
    lines: { thrilled: "", happy: "", meh: "", angry: "" },
    refusal: "",
  },
];

export function getJob(id: JobId): Job {
  const job = JOBS.find((j) => j.id === id);
  if (!job) throw new Error(`Unknown job ${id}`);
  return job;
}

export function zoneLabel(job: Job): string | null {
  const zone = job.body.zone;
  if (!job.targetZone || zone === "back") return null;
  return TARGET_ZONES[zone].label;
}

// Size label shown on the order, from the midpoint of the coverage range.
export function sizeLabel(coverage: Job["coverage"]): "Small" | "Medium" | "Large" | null {
  if (!coverage) return null;
  const mid = (coverage.min + coverage.max) / 2;
  return mid < 0.15 ? "Small" : mid < 0.3 ? "Medium" : "Large";
}
