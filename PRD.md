# PRD: INKED IN LEONIDA

> Version 1.0 · Sep 25, 2026 · Owner: @bholdguy
> Challenge: Unlayer "Build with React Image Editor" (#BuiltWithImageEditor)
> Hard deadline: **Sunday Sep 27, 2026, 23:59 UTC**. Internal ship target: **Sunday 20:00 UTC**.

This document is the single source of truth. It is written for an AI coding agent (Claude Code) to build from with no clarifying questions. If something here is wrong or impossible, STOP, write the problem in Section 16 (Project State > Blockers), and propose an amendment. Do not improvise around the spec.

---

## 0. How to use this document (agent instructions)

1. Read the whole PRD before writing code. Then read `NOTES.md` (discovery findings from Phase 0).
2. Build **one phase at a time** (Section 13). Each phase is a vertical slice that ends in a deployed, working build.
3. Every phase ends at a **GATE**. At a gate: run `npm run typecheck && npm run lint && npm run test && npm run build`, deploy to Vercel, tick the boxes in Section 16, then STOP and report to the human.
4. Rules in Section 12 use MUST / MUST NOT. They are absolute.
5. If a library API differs from what this PRD assumes, trust the installed package source in `node_modules`, not this document and not your memory. Log the difference in Section 16.

---

## 1. One-liner

A GTA VI-inspired tattoo parlor game. You are the night-shift artist on the Leonida strip. Clients walk in with orders, you design the ink in Unlayer's React Image Editor, place it anywhere on their body, and they react. Your work follows you: a client comes back and you have to cover up your own tattoo.

**Pitch line:** *Their parlor is a menu. This one isn't.*

---

## 2. Problem (evidence-backed)

Player research across Reddit and X (Sep 2026) found three repeated complaints this build answers directly:

1. **Tattoos are a catalog locked to fixed body slots.** A 2.3k-upvote r/GTA6 thread on reused Online tattoos has commenters asking to design their own ink and place it anywhere. Wishlist posts ask for "a tattoo system that isn't just picking from a list" and typed lettering in different fonts. Announced GTA VI marketing still shows a preset parlor.
2. **There are no letters.** The crew emblem editor has no text tool. Players spend hours building words out of triangles and circles.
3. **Placement is the pain, more than the art.** Players like existing designs but hate fixed zones, no resizing, no rotation.

**What this build answers, mapped:**

| Pain | Our answer |
|---|---|
| Catalog tattoos | You draw every piece in a real editor |
| No lettering | Lettering is required in most orders; text tool is a hero tool |
| Fixed slots | Free placement: drag, scale, rotate anywhere on the body |

---

## 3. Who it's for

- **Primary: the judges.** They will open the live URL on desktop, play for 3 to 6 minutes, and read the README. Scoring criteria (unweighted): **creativity, visual execution, use of React Image Editor, overall experience.**
- **Secondary: GTA fans on X** who see the share card with #BuiltWithImageEditor.

Design every decision for a judge who has already seen 20 entries, most of them wanted posters and evidence-tampering games.

---

## 4. Goals and success criteria

| Judging criterion | What "winning" looks like here | Measurable check |
|---|---|---|
| Creativity | Craft-sim genre nobody else entered. Cover-up of your own earlier work. | Full run contains 3 client jobs + cover-up + self-ink finale |
| Visual execution | Neon night-shop aesthetic, ink that looks like skin not a sticker | Composite uses multiply blend + body clipping; no default-looking pages |
| Use of React Image Editor | Editor is the only way to make anything. Per-job tool configs, themed labels, reset() for cover-up, hasChanges() guard, onSave pipeline | README table lists every integration point with file paths |
| Overall experience | Fast, funny, never breaks | Full playthrough under 6 minutes; zero dead ends if the AI API or CDN fails |

**Ship criteria:** live Vercel URL, public GitHub repo, README, form submitted, X post with #BuiltWithImageEditor tagging @unlayer.

---

## 5. Non-goals (do NOT build)

- 3D bodies, UV mapping, three.js, WebGL.
- Accounts, auth, databases, multiplayer, leaderboards.
- Unlayer AI Assistant (paid, needs projectId). MUST stay disabled.
- Photo upload of real people's bodies.
- More than 3 client jobs + 1 finale. No extra clients until every phase gate passes.
- Money economy beyond a tips counter.
- Any Rockstar asset, logo, font, character, or in-game brand name.

---

## 6. Constraints

- Solo builder, ~55 hours, vibecoded via Claude Code.
- Unlayer editor loads from Unlayer's CDN at runtime. The app MUST handle CDN failure gracefully.
- Free-tier vision API only. The game MUST be fully playable with the API off.
- Desktop-first. Must still be usable at 390px width (show a "best on desktop" banner under 768px, never block play).

---

## 7. Tech stack (locked)

| Layer | Choice | Rejected alternative, and why |
|---|---|---|
| Framework | Next.js 15 App Router, TypeScript, `src/` dir | Vite: lighter, but we need one server route for the judge and the owner's existing design-system prompt targets Next |
| Styling | Tailwind CSS v4 | CSS modules: slower to iterate |
| Editor | `@unlayer/react-image-editor` | None. Required by the challenge |
| State | `zustand` | useReducer + context: fine but more boilerplate across screens |
| Image processing | Canvas 2D API, pure functions on RGBA arrays | sharp/jimp: server-side, adds latency |
| Vision judge | Gemini Flash-class model via REST, one Route Handler | Unlayer AI Assistant: paid. Groq vision: acceptable backup, same interface |
| Tests | Vitest (pure functions only) | Playwright: no time for E2E |
| Audio | Web Audio API synth, no sound files | Audio assets: licensing and weight |
| Hosting | Vercel | None |

**Allowed dependencies:** next, react, react-dom, @unlayer/react-image-editor, zustand, tailwindcss (+ its PostCSS plugin), vitest, typescript, eslint and their type packages. Anything else requires a line in Section 16 explaining why.

---

## 8. Experience spec

### 8.1 Screen flow (state machine)

```
TITLE
  -> NIGHT_INTRO(night 1)
  -> ORDER(job: tino-1) -> STUDIO -> PLACEMENT -> INKING -> VERDICT -> INKGRAM
  -> ORDER(job: kaylee-1) -> STUDIO -> PLACEMENT -> INKING -> VERDICT -> INKGRAM
  -> NIGHT_INTRO(night 2)
  -> ORDER(job: tino-2 coverup) -> STUDIO -> PLACEMENT -> INKING -> VERDICT -> INKGRAM
  -> FINALE_INTRO
  -> SELF_SETUP (pick zone + skin tone) -> STUDIO -> PLACEMENT -> INKING -> SELF_REVEAL
  -> SHOP_WALL (end screen)
```

`screen` and `currentJobIndex` live in the zustand store. Back navigation is not required. A "Restart shift" button on SHOP_WALL resets the store.

### 8.2 Screens

**TITLE**
- Neon sign "INKED IN LEONIDA" with a subtle flicker (CSS keyframes, disabled under prefers-reduced-motion).
- Tagline: "Night shift on the strip. Their parlor is a menu. This one isn't."
- Buttons: "Open the shop" (primary), sound toggle (off by default).
- Footer: fan disclaimer + "Built with Unlayer React Image Editor".

**NIGHT_INTRO**
- Full-screen card, 2.5s auto-advance or click: "NIGHT 1 · 11:48 PM · The strip is loud." / "NIGHT 2 · 12:10 AM · Somebody's back."
- On night 2 only: one-line callback to Kaylee's result (see 9.3).

**ORDER**
- Client card: illustrated initials badge (generated in CSS, no portraits needed), name, one-line bio, the request as dialogue, and a checklist panel:
  - Motif, Lettering (exact text), Colors required, Placement zone, Size (small / medium / large from coverage range).
- Button: "Start the stencil".

**STUDIO**
- Order checklist pinned on the left (collapsible on mobile).
- `<ImageEditor>` fills the rest. Mounted with `key={job.id}` so each job gets a fresh editor.
- Tool config per job (Section 10.2). Themed labels via translations (Section 10.3).
- The editor's own Save button is the "Transfer" action. If translations allow, relabel Save to "TRANSFER STENCIL".
- Our own button "Transfer stencil" above the editor as a second path: it calls `editor.hasChanges()`; if false, shake + toast "Empty stencil. The client is staring at you."; if true, call `editor.getImage()` and proceed. See Known Gotchas (14.2) about uncommitted panel edits.

**PLACEMENT**
- Stage shows the body image (Section 11.1) at a fixed 4:5 aspect.
- The processed tattoo layer (white stripped to transparent, Section 9.1) sits on top.
- Controls: drag with pointer (mouse + touch via Pointer Events), "Size" slider (0.2x to 1.5x), "Rotate" slider (-180 to 180). Keyboard: arrows nudge 1%, shift+arrows 5%.
- Target zone shown as a faint dashed outline with label ("Inside left forearm"). Finale has no target zone.
- Live preview uses the same compositing as the final output (multiply blend, clipped to body).
- Button: "Lock it in".

**INKING**
- 2.5s animation: a reveal mask sweeps the tattoo from 0% to 100% along its bounding box with a small "needle" dot leading the edge.
- If sound on: needle buzz (Section 11.4).
- After reveal: a soft red "fresh ink" halo fades out over 1s (CSS filter drop-shadow).
- Meanwhile the judge request fires (Section 9). INKING never waits longer than 9s; fallback kicks in.

**VERDICT**
- Client reaction line (large), mood emoji-free badge (THRILLED / HAPPY / MEH / ANGRY), 1 to 5 stars, tip amount.
- Score breakdown bars with labels and values (Section 9.2). Transparency sells the scoring to judges.
- Small tag if fallback was used: "Client squinted at it." (never show error jargon).
- Button: "Post to InkGram".

**INKGRAM**
- In-world feed post: the composite image, client handle, caption (the reaction line), stars, like count (derived: stars * random 180-420, seeded by job id so it is stable).
- Buttons: "Download card" (1080x1350 PNG, Section 11.3), "Share on X" (web intent with prefilled text, Section 11.3), "Next client".

**FINALE_INTRO**
- "Shop's empty. Last chair's yours."

**SELF_SETUP**
- Pick body zone: Forearm or Back.
- Pick skin tone: Light, Medium, Deep.
- Then STUDIO with all 8 tools, no order, no scoring.

**SELF_REVEAL**
- The composite on a large stage, "YOUR INK" title, download card + share on X.

**SHOP_WALL**
- Grid of all 4 pieces as framed flash on a wall, total tips, shop rating (average stars of 3 jobs), "Restart shift".
- Persist the wall in localStorage (try/catch; the game MUST work if storage throws).

### 8.3 Visual direction

- Mood: Leonida night strip. Neon on black, humid glow, sunset accents.
- Tokens (define as CSS variables in `globals.css`):
  - `--night: #0B0714` (background), `--panel: #160E24`, `--pink: #FF3E9A`, `--teal: #19E3D1`, `--sunset: #FF8A3D`, `--ink: #F4EDE4` (text), `--muted: #9C8FB0`.
- Fonts (Google Fonts via `next/font/google`): **Syne** (display), **Space Grotesk** (UI/body), **Pirata One** (tattoo-flash accents, headers on ORDER and SHOP_WALL only).
- MUST NOT use the Pricedown font or anything imitating the GTA logo.
- Neon effect: layered `text-shadow` in pink/teal. Keep it to titles; body text stays clean and readable.
- Texture: subtle CSS noise overlay (inline SVG data URI) at 4% opacity.

---

## 9. Game logic spec

### 9.1 Image pipeline (pure functions, `src/lib/ink/`)

All functions operate on a plain `{ data: Uint8ClampedArray; width: number; height: number }` type called `RGBAImage`. No DOM in these functions, so they are unit-testable in Node.

1. `normalize(stencilDataUrl) -> RGBAImage` (DOM helper in `src/lib/ink/dom.ts`): draw into a 512x512 canvas, letterboxed on white if aspect differs. Input is the raw 1024x1024 editor output (`JobResult.stencil`; JPEG for opaque stencils, see NOTES.md). The 512 image is for analysis only and is never stored or fed back into the editor. The old stencil (tino-1) and the new stencil (tino-2) MUST pass through this exact same function before `concealment()`.
2. `whiteToAlpha(img, lo = 225, hi = 245) -> RGBAImage`: luminance L = 0.2126R + 0.7152G + 0.0722B. If L >= hi, alpha = 0. If L <= lo, alpha unchanged. Between: alpha scales linearly to 0. Saturated light colors (HSL s > 0.35 AND chroma max-min > 32) are NEVER stripped, so pastel pink survives. The chroma floor is JPEG tolerance: near-white JPEG noise has HSL s near 1 but chroma <= 24.
3. `inkMask(img) -> Uint8Array`: 1 where alpha > 32 after whiteToAlpha.
4. `coverage(mask) -> number`: ink pixels / total pixels, measured on the 512x512 normalized stencil mask (not the composite).
5. `classifyColor(r, g, b) -> ColorName`: convert to HSL.
   - l < 0.18, or (s < 0.18 and l < 0.6): `black`
   - s < 0.18: `black` (grays count as black ink)
   - chroma (max-min) <= 24: `black` (JPEG tolerance: +/-12 noise on a neutral stroke)
   - hue 345-15: `red` (but if l > 0.68: `pink`)
   - 15-40: `orange` · 40-65: `yellow` · 65-170: `green` · 170-260: `blue` · 260-300: `purple` · 300-345: `pink`
6. `colorShare(img, mask) -> Record<ColorName, number>`: fraction of ink pixels per color.
7. `concealment(oldImg, newImg) -> number` (cover-up only): old ink = `inkMask(whiteToAlpha(oldImg))`; for each old ink pixel, it is "still visible" if the new pixel's RGB euclidean distance to the old pixel is < 40 **and its outline survives**: within 6 px (512 analysis scale) some pixel that contrasted with it in the old stencil (distance >= 40) still contrasts with it in the new one. Pixels deeper than 6 px inside a stroke, with no old outline in reach, keep the plain color rule. Return 1 - visible / oldInkCount. (Amended in 3.3, see Section 16 item 35: without the outline rule, black ink painted over the black CRYSTAL letters always counted as "still visible".)
8. `placementHit(center, zone) -> boolean`: normalized center point (0..1) inside the zone rect.

### 9.2 Scoring

**Standard job (tino-1, kaylee-1), 100 points:**

| Part | Points | Rule |
|---|---|---|
| Palette | 25 | Each required color with share >= 0.05 earns an equal slice. Any forbidden color with share > 0.10 subtracts 10 (floor 0). |
| Coverage | 15 | Full if within [min, max]. Linear falloff to 0 at half-min or 1.5x max. |
| Placement | 10 | 10 if center inside target zone, else 0. |
| Motif | 25 | Vision `motifMatch` true = 25. Fallback: 15. |
| Lettering | 25 | Vision `letteringMatch` true = 25; lettering found but wrong = 10. Fallback: 15. |

**Cover-up job (tino-2), 100 points:**

| Part | Points | Rule |
|---|---|---|
| Concealment | 40 | 40 * clamp((concealment - 0.5) / 0.4, 0, 1). So 90%+ hidden = full. |
| Old name unreadable | 20 | Vision `oldTextReadable` false = 20. Fallback: 20 if concealment >= 0.85 else 0. |
| Palette | 15 | Required `black` share >= 0.25. |
| Motif | 25 | Vision `motifMatch` (anything in the requested set) = 25. Fallback: 15. |

**Offensive content:** if vision returns `offensive: true`, score = 0, mood ANGRY, reaction = the client's refusal line, and the VERDICT button becomes "Start over" (remounts STUDIO for the same job). Deterministic fallback cannot detect this; that is acceptable.

**Stars:** 90+ = 5, 75+ = 4, 55+ = 3, 35+ = 2, else 1.
**Mood:** 5 stars THRILLED, 4 HAPPY, 3 MEH, 1-2 ANGRY.
**Tip:** `basePay * stars / 5`, rounded to $5.

### 9.3 Night 2 callback

On NIGHT_INTRO(2), show one line based on Kaylee's stars:
- 4-5: "Kaylee's post hit 40K likes. Your DMs are on fire."
- 3: "Kaylee posted it. Then archived it."
- 1-2: "Kaylee posted a story about 'a certain shop'. You're the certain shop."

---

## 10. React Image Editor integration spec

### 10.1 Component

`src/components/studio/InkEditor.tsx` ("use client"):

- Props: `job: Job`, `startImage: string` (data URL), `onTransfer(dataUrl: string)`.
- Renders `<ImageEditor ref image={startImage} options={...} minHeight={640} onSave onLoadError onError onLoad />`.
- `key={job.id}` on the parent so each job remounts cleanly.
- `options.theme: "dark"`.
- MUST NOT set `projectId`. Set `features.ai: false` and `aiAssistantOpenState: "closed"` explicitly (the default open state is `'open'`).
- The component ref is `{ editor: ImageEditorInstance | null }`, not the instance: use `ref.current?.editor`, or the instance passed to `onLoad`. `getImage()` returns `string | null`; treat `null` like an empty stencil.

### 10.2 Tool config per job (`options.features.imageEditor.tools`)

| Job | crop | resize | filter | draw | text | shapes | stickers | frame |
|---|---|---|---|---|---|---|---|---|
| tino-1 | on | off | on | on | on | on | on | off |
| kaylee-1 | on | off | on | on | on | on | on | off |
| tino-2 (cover-up) | **off** | **off** | on | on | on | on | on | off |
| self | on | on | on | on | on | on | on | on |

Why: resize and frame make no sense for skin. Crop MUST be off in the cover-up because concealment compares pixels at the same coordinates. The finale unlocks everything as a reward.

### 10.3 Themed labels

Use `options.translations` (`{ en: { key: label } }`) with the keys verified in `NOTES.md`. Every rail label MUST be 8 characters or less (longer labels truncate in the rail).

| Default | Key | Shop label |
|---|---|---|
| Draw | `image_editor.tools.draw` | Needle |
| Text | `image_editor.tools.text` | Script |
| Stickers | `image_editor.tools.stickers` | Flash |
| Shapes | `image_editor.tools.shapes` | Stencil |
| Filter | `image_editor.tools.filter` | Ink Age |
| Crop | `image_editor.tools.crop` | Trim |
| Frame | `image_editor.tools.frame` | Border |
| Resize | `image_editor.tools.resize` | (default "Resize") |
| Save | `image_editor.toolbar.save` | Transfer Stencil (it fits the toolbar button; fall back to "Transfer" if it ever truncates) |

The keys were found and runtime-verified, so the legend-bar fallback is not needed. Do not hack the editor DOM.

### 10.4 Start images

- Standard jobs and self: `/stencils/blank.png` converted to a data URL (1024x1024 white).
- Cover-up: the **raw 1024x1024 editor output** saved from tino-1 (not normalized, not the composite), as a data URL. This is the "your own work comes back" moment. Store it in zustand as `results["tino-1"].stencil` (`JobResult.stencil`). The editor saves opaque stencils as JPEG; that is expected.

### 10.5 Callbacks

- `onSave({ dataUrl })` -> `onTransfer(dataUrl)`.
- `onLoadError` -> toast "Stencil paper jammed" + "Retry" that calls `editor.reset(startImage)`.
- `onError` -> render diegetic screen "POWER'S OUT AT THE SHOP" with Retry (remount by bumping a key). The game shell stays usable.
- `onLoad(editor)` -> store instance for the Transfer button.

---

## 11. Assets, judge API, share, audio

### 11.1 Body art

Location: `public/bodies/`. Files (PNG, transparent background, 1000x1250, 4:5):

| File | Used by | Zone rect (normalized x, y, w, h) |
|---|---|---|
| `forearm-deep.png` | tino-1, tino-2, self (deep, forearm) | 0.30, 0.35, 0.40, 0.35 |
| `shoulder-light.png` | kaylee-1 | 0.25, 0.20, 0.45, 0.40 |
| `forearm-light.png`, `forearm-medium.png` | self | n/a |
| `back-light.png`, `back-medium.png`, `back-deep.png` | self | n/a |

**Placeholders are real PNG files** already committed at the paths above: 1000x1250, transparent background, a rounded limb shape filled with the skin tone hex (generated once in Phase 0 by a throwaway script, now deleted). Real art replaces them in Phase 4 by overwriting the files, with zero code changes. Code MUST read body sources from one config map (`src/data/bodies.ts`) that points at these files. No SVG or in-code placeholder component.

Skin hex (placeholder + fallback): light `#E8C3A0`, medium `#B98260`, deep `#6B4430`.

Art generation prompt for the owner (any image model):
> "Clean stylized illustration of a [bare inner forearm / bare shoulder and upper arm / bare upper back], [light / medium / deep brown] skin, soft studio lighting, subtle skin texture, no tattoos, no jewelry, no text, isolated on a transparent background, vertical 4:5 composition, semi-realistic digital painting."

### 11.2 Compositing (`src/lib/ink/composite.ts`, DOM)

1. Draw the body PNG (from `src/data/bodies.ts`) onto the 1000x1250 base canvas.
2. Tattoo layer: `whiteToAlpha` applied to the raw 1024 stencil (`JobResult.stencil`), at full resolution. The 512 normalized image is for analysis only and is not used here.
3. On a 1000x1250 offscreen canvas, draw the tattoo layer with the placement transform (cx, cy, scale, rotate) and `filter = "blur(0.4px)"`, then draw the body PNG with `globalCompositeOperation = "destination-in"` so ink outside the body alpha is removed.
4. Draw the offscreen canvas onto the base with `globalCompositeOperation = "multiply"`, alpha 0.92. (Steps 3-4 replace the earlier "multiply directly, then clip" wording; this is the one method.)
5. Output: 1000x1250 composite PNG data URL. Also a 512px JPEG (quality 0.85) for the judge.
6. The PLACEMENT live preview calls this same function.

### 11.3 Judge API

**Route:** `POST /api/judge` (`src/app/api/judge/route.ts`, Node runtime).

Request:
```json
{
  "jobId": "tino-1",
  "compositeJpegB64": "<512px jpeg of the tattoo on skin, no data: prefix>",
  "stencilJpegB64": "<optional: 512px jpeg of the stencil on white, no data: prefix>"
}
```
The server derives everything else from `jobId` via `src/data/jobs.ts`: client name, bio, motif, lettering, mode, and for the cover-up the old lettering (tino-1's `lettering`). Any client-sent `order`, `mode` or `oldLettering` is ignored entirely (prompt-injection guard). Unknown or free-mode job IDs, non-JPEG or oversized images (> 700k base64 chars) return the fallback.

Response (always 200 with this shape, even on failure):
```json
{
  "source": "vision",
  "motifMatch": true,
  "letteringFound": "CRYSTAL",
  "letteringMatch": true,
  "oldTextReadable": null,
  "offensive": false,
  "reaction": "Bro. She's gonna cry.",
  "mood": "thrilled"
}
```
On any failure (no key, timeout 8s, bad JSON, 4xx/5xx): `{ "source": "fallback" }` and the client uses the fallback rules and canned lines.

- Env: `GEMINI_API_KEY` (server only, Vercel Production only), `GEMINI_MODEL` (default `gemini-3.5-flash-lite`, chosen in task 2.0), optional `GEMINI_THINKING_LEVEL` (default `minimal`). Key sent in the `x-goog-api-key` header, never in the URL.
- Use the REST `generateContent` endpoint with JSON response mode (`responseMimeType: "application/json"` plus `responseSchema`). Validate the returned JSON by hand anyway (type checks per field); on mismatch return fallback.
- With a stencil, send two labelled images: part "Image 1: STENCIL" + stencil, part "Image 2: TATTOO ON SKIN" + composite. Motif and lettering are judged from the stencil, the reaction from the skin.
- Dev-only test switch `JUDGE_FORCE=offensive|fallback|slow` (server-side; ignored when `NODE_ENV` is `production`, unit-tested).
- Truncate `reaction` to 140 chars. Strip anything that is not plain text.
- Cache by SHA-256 of jobId + images in a module-level Map (best effort, per instance, 100 entries, vision verdicts only).
- Rate limit: 20 requests per client IP (first `x-forwarded-for` entry) per 10 minutes, sliding window, checked before anything else. Over the limit returns 200 `{ source: "fallback" }`. In-memory and per server instance: best effort only (each Vercel instance and cold start has its own counter).
- MUST NOT log image data. MUST NOT expose the key to the client.

**Vision system prompt (use verbatim, fill the brackets):**
```
You are judging a tattoo in a comedy tattoo-parlor game. You see a tattoo on skin.
  (WITH STENCIL, replaces the sentence above:
   You get two images.
   Image 1 is the STENCIL: the design exactly as the artist drew it, on white paper. Judge the motif and the lettering from the STENCIL.
   Image 2 is the TATTOO ON SKIN: the same design inked on the client. React to the TATTOO ON SKIN.)
Client: [name]. Personality: [bio]. They ordered: motif "[motif]", lettering "[lettering or none]".
[COVER-UP ONLY: This is a cover-up. The old tattoo said "[oldLettering]". Report whether that old word is still readable.]
Return ONLY JSON with keys:
motifMatch (boolean: is the ordered motif, or something clearly meant as it, present? Be generous with rough drawings),
letteringFound (string of any readable text, or null),
letteringMatch (boolean: does readable text match the ordered lettering, ignoring case and small typos?),
oldTextReadable (boolean or null),
offensive (boolean: slurs, hate symbols, sexual content, or graphic gore),
reaction (one short line, max 20 words, in the client's voice, funny, PG-13, no slurs, reacting to THIS tattoo),
mood (one of: thrilled, happy, meh, angry).
```
Note: the final mood shown to the player comes from the score (9.2), not the model. The model's reaction line is used only when its mood is within one step of the score mood; otherwise use the canned line for the score mood. This keeps the words and the number consistent.

### 11.4 Share card and X

- `src/lib/share/card.ts`: 1080x1350 canvas. Night background, composite image top (1000x1000 center crop of the composite), below: client handle, stars, reaction line (wrap to 2 lines max), footer "INKED IN LEONIDA · #BuiltWithImageEditor".
- Download via an anchor with `download` attribute and a blob URL.
- X intent: `https://x.com/intent/post?text=` + encodeURIComponent(`I just inked ${client} at a Leonida tattoo shop. ${stars}★ ${url} #BuiltWithImageEditor @unlayer`). Note in UI: "Attach your downloaded card to the post."

### 11.5 Audio (off by default)

`src/lib/audio.ts`. Create AudioContext only after a user gesture.
- Needle buzz: sawtooth oscillator 110 Hz through a lowpass at 900 Hz, gain modulated by a 32 Hz LFO, volume 0.08, runs for the INKING duration.
- Verdict stamp: short noise burst with fast decay.
- Toggle stored in zustand (and localStorage, guarded).

---

## 12. Rules (absolute)

- MUST keep `@unlayer/react-image-editor` as the only place pixels are authored by the player.
- MUST keep all scoring math in pure functions under `src/lib/ink/` with Vitest tests.
- MUST keep the game fully playable with `GEMINI_API_KEY` unset.
- MUST wrap every localStorage call in try/catch.
- MUST respect `prefers-reduced-motion` (skip flicker and sweep, show result instantly).
- MUST NOT enable Unlayer AI Assistant or set projectId.
- MUST NOT use Rockstar/GTA logos, the Pricedown font, real character names (for example Lucia, Jason), or real in-game business names. All names in this PRD are original.
- Leonida may be used as the setting name. No other in-game place names.
- MUST NOT add dependencies outside Section 7 without logging why in Section 16.
- MUST NOT hide errors from the player with blank screens. Every failure has a diegetic message and a retry.
- MUST NOT start the next phase before the current gate passes.
- MUST commit at the end of each task with a conventional commit message (`feat:`, `fix:`, `chore:`).
- MUST NEVER write a real or realistic-looking key, token or secret into any file (code, tests, fixtures, docs, logs). Test values use obvious fakes that match no provider's key pattern, e.g. `"test-key-not-real"` (never the shape of a real Google, OpenAI or GitHub key). Real keys live only in `.env.local` (gitignored) and Vercel env vars, and are never printed.

---

## 13. Build plan (vertical slices with gates)

Time budget assumes start Fri Sep 25 evening (UTC+1 local).

### Phase 0: Scaffold (done in Step 1, verify only)
- [x] Next.js 15 + TS + Tailwind v4 in `src/`
- [x] Editor renders on white stencil, Save shows preview
- [x] `NOTES.md` has translation keys, tool keys, transparency finding
- [x] Public GitHub repo, live on Vercel

**GATE 0:** live URL renders the editor.

### Phase 1: One job end to end (Fri night, ~5h)
Goal: tino-1 fully playable with placeholders and deterministic scoring only.
- [x] 1.1 Types + data: `src/data/jobs.ts`, `src/data/bodies.ts` (Section 15)
- [x] 1.2 zustand store: screen, jobIndex, per-job results, sound flag
- [x] 1.3 Pure ink functions (9.1) + Vitest tests (Section 13.1)
- [x] 1.4 ORDER screen
- [x] 1.5 STUDIO with per-job tool config and Transfer + hasChanges guard
- [x] 1.6 PLACEMENT with placeholder body PNG (`public/bodies/`), drag/size/rotate, target zone
- [x] 1.7 Compositing (11.2)
- [x] 1.8 VERDICT with deterministic parts; motif/lettering use fallback values
- [x] 1.9 Minimal routing between screens for tino-1

**GATE 1:** On the deployed URL, a person can go ORDER -> STUDIO -> PLACEMENT -> VERDICT for Tino and see a score breakdown. Tests pass.

### Phase 2: The judge (Sat morning, ~3h)
- [x] 2.0 Live Gemini probe: model, JSON mode, thinking level, latency (owner-approved, max 8 calls)
- [x] 2.1 `/api/judge` route per 11.3 with timeout, validation, cache, fallback
- [x] 2.2 Client call from INKING; merge into score per 9.2
- [x] 2.3 Canned lines (Section 15.2) + mood consistency rule
- [x] 2.4 Offensive path -> "Start over"
- [x] 2.5 "Client squinted at it" tag on fallback
- [x] 2.6 Hardening (verifier fixes before GATE 2): editor load timeout, error boundaries, dead ends, /api/judge rate limit, footer wording, housekeeping

**GATE 2: PASSED 2026-09-26** (production with key: agent run 100/100 via real editor; Preview without key: owner run). With the key set, reactions are specific to the drawing. With the key removed, the game still completes with canned lines. Both verified on Vercel (use a Preview deployment without the env var).

### Phase 3: Full content loop (Sat afternoon, ~5h)
- [x] 3.1 kaylee-1 job with shoulder placeholder
- [x] 3.2 NIGHT_INTRO screens + Kaylee callback (9.3)
- [x] 3.3 tino-2 cover-up: start image = tino-1 stencil, crop/resize off, concealment scoring
- [x] 3.4 FINALE_INTRO, SELF_SETUP, SELF_REVEAL
- [x] 3.5 SHOP_WALL with localStorage persistence
- [x] 3.6 Themed labels (10.3) or legend fallback

**GATE 3:** One full run from TITLE to SHOP_WALL on the deployed URL in under 6 minutes, cover-up opens on the exact stencil made for tino-1.

### Phase 4: Polish (Sun morning, ~5h)
- [ ] 4.1 Visual direction (8.3): tokens, fonts, neon title, noise texture
- [ ] 4.2 INKING animation + fresh-ink halo + reduced-motion path
- [ ] 4.3 Audio (11.5)
- [ ] 4.4 INKGRAM screen + share card + X intent
- [ ] 4.5 Real body art dropped in (if available; placeholders are acceptable)
- [ ] 4.6 Error screens: CDN failure, image load failure
- [ ] 4.7 Mobile pass at 390px + "best on desktop" banner
- [ ] 4.8 Title screen and footer disclaimer

**GATE 4:** Owner plays a full run on desktop and on a phone with no broken states.

### Phase 5: Ship (Sun afternoon, ~2h, done by 20:00 UTC)
- [ ] 5.1 README (Section 17)
- [ ] 5.2 OG image + meta tags (title, description, share preview)
- [ ] 5.3 Final `npm run build` clean, no console errors on production
- [ ] 5.4 Owner records the 90s demo (Section 18)
- [ ] 5.5 Owner submits the form and posts on X

### 13.1 Required tests (Vitest, `src/lib/ink/__tests__/`)
- whiteToAlpha: pure white -> alpha 0; pure black unchanged; pastel pink (255,170,210) NOT stripped.
- classifyColor: (220,30,40) red; (255,150,190) pink; (255,140,40) orange; (20,20,20) black; (128,128,128) black; (40,180,60) green.
- coverage: 10x10 image with 25 ink pixels -> 0.25.
- colorShare: half red half black -> ~0.5 each.
- concealment: identical images -> 0; old ink fully painted black over red -> 1.
- placementHit: center inside/outside.
- score: known inputs produce the exact totals from 9.2 for both modes.

---

## 14. Risks and known gotchas

### 14.1 Risks
| Risk | Mitigation |
|---|---|
| Unlayer CDN slow/unavailable during judging | Diegetic error + retry; README notes the editor needs network |
| Vision API rate limits or dead key | Fallback path is first-class, tested at Gate 2 |
| Players draw offensive content | Vision `offensive` flag; no public gallery, nothing is stored server side |
| Editor unusable on narrow phones | Desktop banner; never block |
| Time overrun | Cut order if late: audio, then real body art, then Kaylee callback. NEVER cut the cover-up or the finale |

### 14.2 Known gotchas (verify, then log findings in Section 16)
- Another entrant reports that filter and crop edits only commit when their panel is closed. If `getImage()` misses uncommitted edits, prefer the editor's own Save path and tell the player "Close the tool panel, then Transfer."
- Changing the `image` prop calls `reset()` and clears undo history. Only set it at mount.
- Changing `options.features` remounts the editor. Decide tools before mount (we do, via `key={job.id}`).
- React Strict Mode double-mounts in dev. If the editor breaks in dev only, set `reactStrictMode: false`.
- `onSave` returns `{ dataUrl, blob }`. Use `dataUrl`.

---

## 15. Data contracts

### 15.1 Types (`src/types.ts`)

```ts
export type ColorName = "black" | "red" | "pink" | "orange" | "yellow" | "green" | "blue" | "purple";
export type BodyZone = "forearm" | "shoulder" | "back";
export type SkinTone = "light" | "medium" | "deep";
export type Mood = "thrilled" | "happy" | "meh" | "angry";
export type JobMode = "standard" | "coverup" | "free";

export interface Rect { x: number; y: number; w: number; h: number } // normalized 0..1

export interface Job {
  id: "tino-1" | "kaylee-1" | "tino-2" | "self";
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
  offensive: boolean;     // vision flagged it: score 0, refusal line, VERDICT offers "Start over"
}
```

### 15.2 Job content (`src/data/jobs.ts`)

**tino-1**
- Client: Tino Batista, @tino.fixes.boats, "Boat mechanic at the marina. Got engaged an hour ago."
- Request: "Her name. CRYSTAL. Inside a heart. Red and black, like an old sailor tattoo. Inside of my forearm so I see it every day."
- motif "heart", lettering "CRYSTAL", required [red, black], forbidden [], coverage 0.08 to 0.40
- body forearm/deep, targetZone per 11.1, basePay 180, startFrom blank
- lines: thrilled "Bro. She's gonna cry. I'm gonna cry. Nobody look at me." · happy "That's clean. Real clean. Crystal's gonna love it." · meh "It's got her name. Probably. Let's go with probably." · angry "My cousin did better at a pool party with a sewing needle."
- refusal: "Nah. My future mother-in-law is gonna see this. Start over."

**kaylee-1**
- Client: Kaylee Kash, @kayleekash, "212K followers. Allegedly. Needs content by sunrise."
- Request: "Something that screams Leonida. Palm tree, sunset, pink and orange. Put STAY LOUD under it. Shoulder. It has to pop on camera."
- motif "palm tree with a sunset", lettering "STAY LOUD", required [pink, orange], forbidden [], coverage 0.10 to 0.45
- body shoulder/light, basePay 250, startFrom blank
- lines: thrilled "This is going straight to the grid. You're getting tagged." · happy "Cute! The lighting is helping, but I'll take it." · meh "It's giving... effort. I'll crop it." · angry "I can't post this. I have a brand. You have a problem."
- refusal: "I literally cannot post that. Try again."

**tino-2 (cover-up)**
- Client: Tino Batista (returning), same handle, "Back. Not engaged anymore."
- Request: "Crystal took the boat. And the dog. Make that name disappear. Put something tough over it. Panther, skull, a storm, I don't care. Dark."
- mode coverup, motif "a panther, a skull, or a storm", motifOptions ["panther", "skull", "storm", "lightning"], lettering null, required [black], coverage null
- body forearm/deep, targetZone same as tino-1, basePay 300, startFrom "tino-1"
- Placement for the cover-up MUST default to tino-1's saved placement so it lands on the old ink.
- lines: thrilled "Crystal who? Never heard of her." · happy "Can't see a thing. Good. Moving on with my life." · meh "I can still kinda see a C. The C haunts me." · angry "It still says CRYSTAL. You basically underlined it."
- refusal: "I'm heartbroken, not crazy. Start over."

**self**
- mode free, no scoring, body chosen in SELF_SETUP, startFrom blank, all tools on.

---

## 16. Project state (agent keeps this updated)

### Completed
<!-- Agent: task IDs with commit hash -->
- Phase 0 scaffold: `f7dec39` · editor + save preview: `44ab7c4` · stencil + body placeholder PNGs: `fe8a512` · PRD/NOTES/README/CLAUDE.md: `4f6f4bc`
- Repo: https://github.com/Bholdguy/inked-in-leonida (public) · Live: https://inked-in-leonida.vercel.app (deployed via `vercel --prod` CLI; Git auto-deploy not connected)
- 1.1 types + data (`src/types.ts`, `src/data/jobs.ts`, `src/data/bodies.ts`): commit "feat: add game types, job data and body config". Added a `JobId` alias to 15.1 types (additive).
- 1.1: `9c46fe9` · 1.2 zustand store (`src/store/game.ts`): commit "feat: add zustand game store"
- 1.2: `fa37f25` · 1.3 pure ink functions + Vitest (`src/lib/ink/*.ts`, `src/lib/ink/__tests__/`): commit "feat: add pure ink pipeline and scoring with tests"
- 1.3: `fcd7cd0` · 1.4 ORDER (`OrderScreen.tsx`, `ClientBadge.tsx`, `OrderChecklist.tsx`; minimal `GameShell.tsx` started early so screens can be seen; 8.3 color tokens added to `globals.css` as Tailwind colors, fonts/neon stay in 4.1): commit "feat: add ORDER screen"
- 1.4: `a1e3e89` · 1.5 STUDIO (`StudioScreen.tsx`, `InkEditor.tsx` rewritten to 10.1 props, `src/lib/editorConfig.ts`, `src/lib/ink/analyze.ts`; onLoadError toast + reset retry and onError "POWER'S OUT" remount retry per 10.5): commit "feat: add STUDIO with per-job tools and transfer guard"
- 1.5: `79c58e2` · 1.6 PLACEMENT (`src/components/placement/PlacementScreen.tsx`, `PlacementStage.tsx`; live preview calls `renderComposite` from `src/lib/ink/composite.ts`, committed here because the preview needs it). No `BodyPlaceholder.tsx` (flag 9: PNG files instead). Scale 1 = stencil drawn 40% of body width; default placement = target zone center: commit "feat: add PLACEMENT with drag, size, rotate and target zone"
- 1.6: `7d7e6de` · 1.7 compositing outputs + lock-in pipeline (`compositeOutputs` in `src/lib/ink/composite.ts`, `src/lib/game/evaluate.ts`, lock-in in `GameShell.tsx` with a retry message on failure; dev-only `window.__game` store handle): commit "feat: composite outputs and lock-in evaluation"
- 1.7: `1022212` · 1.8 VERDICT (`src/components/screens/VerdictScreen.tsx`): reaction, mood badge, stars, tip, score, breakdown bars. Phase 1 button is "Restart shift" (INKGRAM is Phase 4; the fallback tag is task 2.5): commit "feat: add VERDICT screen with score breakdown"
- 1.8: `c781ca1` · 1.9 routing (`src/components/GameShell.tsx`: ORDER -> STUDIO -> PLACEMENT -> VERDICT for tino-1, progress indicator, scroll-to-top, diegetic fallback for later-phase screens, "Restart shift" resets the store): commit "feat: route tino-1 end to end"
- 1.9: `bf28e80`
- GATE 1 approved by owner. Phase 2 on branch `phase-2` · 2.0 Gemini probe: no code, results under Discoveries
- 2.0: `3db4e13` · 2.1 judge route (`src/app/api/judge/route.ts`, `src/lib/judge/{types,prompt,validate,gemini,force}.ts`, tests in `src/lib/judge/__tests__/`): commit "feat: add /api/judge route with validation, timeout and cache"
- 2.1: `41ce673` · privacy footer: `6ea5641` · 2.2 INKING + client call (`src/components/screens/InkingScreen.tsx`, `src/lib/game/judgeClient.ts`, `evaluate.ts` split into `prepareJob` / pure `finishJob`, store `inking` + `startInking`/`finishInking`, `validateVerdict` shared by server and client, "Inking" step in progress bar, 1.2 s minimum on screen): commit "feat: add INKING screen and merge judge verdict into score"
- 2.2: `7b86969` · 2.3 canned lines + mood consistency (`src/lib/ink/reaction.ts` `pickReaction`; `finishJob` takes the full `JudgeResponse`; canned lines were already in `jobs.ts` from 1.1): commit "feat: pick model or canned reaction by mood distance"
- 2.3: `3805d50` · 2.4 offensive path (`JobResult.offensive`, store `startOver`, VERDICT "Start over" + refusal notice): commit "feat: offensive verdict offers Start over and remounts the studio"
- 2.4: `be1ab61` · 2.5 fallback tag on VERDICT (`VerdictScreen.tsx`): commit "feat: show fallback tag on the verdict"
- 2.5: `d862afc` · merged to `main` (fast-forward) for GATE 2
- security fix: `f7d339d` (key-shaped fixture replaced, secrets rule added, incident logged as item 31)
- 2.6 item 1: InkEditor waits for onLoad (loading line, Transfer disabled), 15 s `LOAD_TIMEOUT_MS` -> POWER'S OUT; Retry remounts with a fresh `scriptUrl` (`?retry=N`) because the package loader caches a hung load per URL
- 2.6 item 2: `src/app/error.tsx` + `src/app/global-error.tsx` (own html/body, inline styles), both reset the store then re-render; log only the error digest or name
- 2.6 item 3: VERDICT no-result button, INKING `safeFinish` (vision -> canned fallback -> null + way back), jammed Retry remounts the editor when there is no instance or the reset throws
- 2.6 item 4: `src/lib/judge/rateLimit.ts` (`createRateLimiter`, `judgeLimiter`, `clientIp`), checked first in `/api/judge`
- 2.6 item 5: footer now "Your drawings are sent to Google's Gemini AI for judging. We don't store them."; README note (item 25) updated to match
- 2.6 item 6: `zoneHit` and `verdictFor` (offensive override) are pure in `src/lib/ink/score.ts` and used by `finishJob`; `loadImage` error no longer echoes the image source; no history rewrite (item 34)
- 2.6 done (items 1-6 as separate commits, last `c010807`), pushed to `main`; `phase-2` fast-forwarded for a fresh Preview
- **GATE 2 passed 2026-09-26** (Phase 2 tasks 2.0-2.6 complete)
- Phase 3 on branch `phase-3` · 3.0 shift flow (`src/lib/game/flow.ts` `nextAfterJob` + `kayleeCallback`, store `advance`/`selfBody`/`setSelfBody`/`setSound`, starts on TITLE, restart keeps the sound preference; plain `TitleScreen.tsx`; VERDICT "Next client"): commit "feat: add shift flow from title through the wall"
- 3.0: `97ecfec` · 3.1 kaylee-1: no code needed beyond 3.0 (job data from 1.1, `advance()` routes tino-1 -> kaylee-1 ORDER, shoulder placeholder + "Left shoulder" zone from `bodies.ts`): commit "chore: verify kaylee-1 end to end"
- 3.1: `86823fb` · 3.2 NIGHT_INTRO (`src/components/screens/NightIntroScreen.tsx`: whole card is one button, 2.5 s auto-advance or click, guarded so it advances once; night 2 shows `kayleeCallback(stars)`): commit "feat: add night intro cards with the Kaylee callback"
- 3.2: `877a334` · 3.3 cover-up (`StudioScreen.tsx` opens the editor on `results["tino-1"].stencil` untouched, "Tino's old stencil is missing" + Restart shift guard instead of a blank editor; `PlacementScreen.tsx` defaults to tino-1's saved placement; ORDER shows "Returning client" + the night-1 composite; checklist tip "Tip: set your Script color before typing." on lettering jobs; `concealment()` outline rule (item 35) + 5 tests; route test for server-side oldLettering; dev-only `window.__editor` handle for verification): commit "feat: cover-up opens on the exact night-1 stencil and placement"
- 3.3: `ad7ded2` · 3.4 finale (`FinaleIntroScreen.tsx` "Sit down"; `SelfSetupScreen.tsx` Forearm/Back + Light/Medium/Deep with a body preview, reads the latest body at click time; `SelfRevealScreen.tsx` "YOUR INK" + "Hang it on the wall"; pure `finishFree` in `evaluate.ts`; INKING never calls the judge in free mode; progress bar Your chair / Stencil / Placement / Inking / Reveal; STUDIO side panel "Free hand"): commit "feat: add the self-ink finale without the judge"
- 3.4: `ee688ee` · 3.5 shop wall (`ShopWallScreen.tsx`: 4 framed pieces, tips tonight, shop rating = average stars of the 3 scored jobs, finale "Not for sale", Restart shift; pure `totalTips` + `shopRating` in `src/lib/ink/score.ts`; `src/lib/game/wall.ts` `saveWall`/`loadWall` guard every storage access incl. the `window.localStorage` getter, validate on load, store 240px JPEG thumbnails (`thumbnail()` in `dom.ts`, ~5 KB each); TITLE shows "Last shift: $X in tips · N★ shop rating" with the thumbs): commit "feat: add the shop wall with guarded localStorage"
- 3.5: `202c783` · 3.6 themed labels (`src/lib/editorConfig.ts` `RAIL_LABELS` + `SAVE_LABEL` in `options.translations.en`; `src/lib/__tests__/editorConfig.test.ts` locks AI off / no projectId / 10.2 tool table / labels <= 8 chars; STUDIO hint now names the editor's "Transfer Stencil" button): commit "feat: theme the editor rail with shop labels"

### Current task
<!-- Agent: one task ID -->
- **Phase 3 (branch `phase-3`, started 2026-09-26 12:05 UTC, owner go-ahead given for Phases 3-5 autonomously).** Plan:
  - 3.0 Shift flow in the store: TITLE start screen (plain, styled in 4.8), NIGHT_INTRO, `advance()` after a verdict (tino-1 -> kaylee-1 ORDER; kaylee-1 -> NIGHT_INTRO 2; tino-2 -> FINALE_INTRO), pure `nextStep()` with tests. VERDICT button becomes "Next client" (INKGRAM slots in during 4.4).
  - 3.1 kaylee-1 routed end to end on the shoulder placeholder.
  - 3.2 NIGHT_INTRO (2.5 s auto-advance or click) + Kaylee callback (9.3) as a pure, tested function.
  - 3.3 Cover-up: editor opens on the exact stored `results["tino-1"].stencil` (JPEG from Save or PNG from our Transfer button), crop + resize off, placement defaults to tino-1's saved placement, both stencils through the same `normalize()`, oldLettering derived server-side (route test), diegetic dead-end guard if the tino-1 stencil is missing. Order checklist tip "Tip: set your Script color before typing." on lettering jobs (Phase 3 backlog).
  - 3.4 FINALE_INTRO, SELF_SETUP (zone + tone), self STUDIO with all 8 tools, INKING without the judge, SELF_REVEAL.
  - 3.5 SHOP_WALL (4 framed pieces, total tips, shop rating, Restart shift) + localStorage wall (small JPEG thumbs, every call in try/catch, works if storage throws).
  - 3.6 Themed labels (10.3) via `options.translations`. Note: the brief said "already themed, verify only", but `src/lib/editorConfig.ts` on `main` has no translations; they were only runtime-tested in Phase 0. Implementing them here.
  - GATE 3: typecheck, lint, test, build, client-bundle secret scan, independent reviewer subagent, fixes, merge to `main`, push (Vercel Git integration deploys Production), live check.

### Blockers and amendments
<!-- Agent: anything that forced a deviation from this PRD -->
Plan-review flags (2026-09-25) and owner decisions:

1. **Ref shape.** `ref.current` is `{ editor: ImageEditorInstance | null }`, not the instance. Decision: use `ref.current?.editor` or the `onLoad` instance. PRD 10.1 updated. README (Section 17) wording "ref.hasChanges()" means `ref.current.editor.hasChanges()`.
2. **`getImage()` returns `string | null`.** Decision: `null` is treated like an empty stencil. PRD 10.1 updated.
3. **AI Assistant default.** `aiAssistantOpenState` defaults to `'open'`; `features.ai` default is undeclared. Decision (approved): set `features.ai: false` AND `aiAssistantOpenState: 'closed'`. PRD 10.1 updated. Implemented in Phase 0.
4. **Stencil size contradiction** (9.1 said 512, 15.1 said "normalized 1024", 10.4 said "normalized stencil"). Decision (approved): store the raw 1024 editor output as `JobResult.stencil` and as the cover-up start image; normalize to 512 only for analysis; old and new stencils pass through the exact same `normalize()`. PRD 9.1, 10.4, 11.2, 15.1 updated.
5. **Translation keys found.** `image_editor.tools.*` + `image_editor.toolbar.save`; runtime-verified. The legend fallback in 10.3 is not needed. Extra keys `image_editor.tools.merge`/`corners` exist but the rail shows only the 8 tools.
6. **Gotchas 14.2 confirmed from source** (image prop → reset; non-theme/locale/translations option change → remount by JSON content; `onSave` gives `{dataUrl, blob}`). Strict Mode kept on; the wrapper's cancel chain handles double mount (no dev breakage seen).
7. **Path mismatch** between Step 1 brief and PRD. Decision: follow PRD: `public/stencils/blank.png`, `src/components/studio/InkEditor.tsx`.
8. **PRD.md lived outside the repo.** Decision (approved): copied into repo root and committed.
9. **Body placeholders.** Original plan was SVG data URLs. Decision (changed by owner): real placeholder PNGs generated once and committed at every 11.1 filename; `bodies.ts` points at them; real art is a file replace. The generator used only Node built-ins (`zlib`), so **no temporary dev dependency was added**; script deleted after running. PRD 11.1, 11.2 and task 1.6 updated. The ambiguous 11.2 multiply/clip order is now one method (offscreen clip with `destination-in`, then multiply).
10. **Phase 1 max score for Tino is 80 (4 stars)** because motif and lettering use the fallback 15 each. Decision: accepted.
11. **Coverage basis unspecified.** Decision (approved): measured on the 512 normalized stencil mask. PRD 9.1 updated.
12. **`typecheck` and `test` scripts missing.** `typecheck` added in Phase 0; `test` arrives with Vitest in task 1.3.
13. **classifyColor rules are redundant but consistent** (`s < 0.18 → black` subsumes the second clause of the first rule). All 13.1 colors hand-checked. No change.
14. **"Vice strip" subtitle.** Decision: changed to "Night shift on the strip." Rule added to Section 12: "Leonida may be used as the setting name. No other in-game place names."
15. **Rail labels truncate** ("Flash Sheet" → "Flash Sh..."). Decision: every rail label is 8 characters or less: Needle, Script, Flash, Stencil, Ink Age, Trim, Border. Save stays "Transfer Stencil" (it fit in the Phase 0 runtime test). PRD 10.3 updated.
16. **Compositing on the full 1024 stencil** (11.2 step 2): approved.
17. **JPEG output test (2026-09-25).** Regenerated `blank.png` as white at alpha 250 and saved from the editor: output was still `image/jpeg` 1024x1024, with the background flattened to `[250,250,250,255]`. Any not-fully-transparent input still exports as JPEG. Decision applied: keep the opaque alpha-255 stencil (reverted), and make `whiteToAlpha`, `classifyColor` and `concealment` JPEG-tolerant with a ±12 noise test (task 1.3).
18. **Vercel Git integration:** the owner is connecting it. Until confirmed, keep deploying with the `vercel --prod` CLI.
19. **Dependencies added in 1.2** (all in the Section 7 allow-list): `zustand` 5.0.15, `vitest` 5.0.2 (dev). Vitest set up in 1.2 instead of 1.3 so the store has a test. `vitest` 5 needs `@types/node` >= 22, so `@types/node` was bumped from ^20 to ^24 (matches local Node 24; a type package, allowed).
20. **JPEG tolerance (1.3).** Two rule additions in 9.1 (updated): `whiteToAlpha` saturated-color exception also needs chroma > 32; `classifyColor` treats chroma <= 24 as `black`. `concealment` keeps the < 40 distance unchanged; it tolerates independent +/-12 noise on old and new stencils (tested). Tests: `src/lib/ink/__tests__/ink.test.ts` "JPEG tolerance" block (every paper pixel stripped, every stroke pixel kept, red stays red, gray stays black, concealment ~0 / 1 / 0.5). Breakdown parts are rounded to 2 decimals (float noise).
21. **Empty-stencil guard on the Save path (1.5).** `hasChanges()` reads `false` inside `onSave` even after drawing (CDN 2.12.0), so it cannot guard Save. Both Transfer paths now also run an ink check (`coverage > 0` via `src/lib/ink/analyze.ts`); our button still calls `hasChanges()` first as 10.5 asks. Same toast for both.
22. **Gotcha 14.2 verified (1.5).** Filter edits in an open panel ARE included by `getImage()` and Save. An unapplied crop is NOT included by `getImage()` but IS committed by Save. Decision per 14.2: the editor Save is the primary path; our button shows "Close the tool panel, then Transfer." Details in NOTES.md.
23. **Stencil format varies (1.5).** Save gives JPEG, `getImage()` gives PNG for the same opaque stencil; a crop can make it non-square. `JobResult.stencil` stores whichever came in; analysis letterboxes via `normalize()`, compositing draws it at its own aspect.
24. **Phase 2 plan decisions (owner, 2026-09-25):** flag 2 server derives order/mode/oldLettering from jobId, client values ignored (11.3 updated); flag 3 optional `stencilJpegB64`, motif + lettering judged from the stencil, reaction from the composite (11.3 + prompt updated); flag 5 `JUDGE_FORCE` dev switch, ignored in production (unit-tested); flag 1 a plain INKING screen now, animation stays in 4.2; flag 4 `responseSchema` + hand validation; flag 6 route `maxDuration` 10 s (Gemini timeout 8 s, client cap 9 s); flag 9 cache key includes jobId; flag 10 Phase 2 on branch `phase-2`, merge to `main` at GATE 2.
25. **Privacy line (flag 8, owner):** footer on the page, updated in 2.6 item 5 to: "Your drawings are sent to Google's Gemini AI for judging. We don't store them." **README draft note for Phase 5:** Privacy: "Your drawings are sent to Google's Gemini AI for judging. We don't store them." Detail line: the stencil and the tattoo-on-skin image (512px JPEGs) go to Google's Gemini API; the game keeps no copy server-side (only a short-lived in-memory cache per server instance); on Gemini's free tier Google may use inputs to improve its products.
26. **`/api/judge` only answers POST.** GET returns Next's default 405. The 200-always rule applies to the POST contract.
27. **Editor Text tool default color (2.2).** New text objects take the current color (red after drawing with the default brush), not black. A player who types CRYSTAL without changing the text Fill color gets no black and loses half the palette points. Scoring is correct; Phase 3/4 order copy or the checklist should hint "set the lettering color".
28. **`JobResult.offensive` (2.4).** Added to 15.1 (updated) so VERDICT can switch its button to "Start over" without guessing from the text. `startOver(jobId)` deletes that job's result, clears the draft and inking state, and returns to STUDIO; STUDIO was unmounted during VERDICT, so the editor remounts fresh on the job's start image.
29. **Narrow widths (2.4 observation).** Below ~600px the editor's Cancel/Save become X / check icons. Worth a line in the Phase 4 mobile pass.
30. **Preview deployments are behind Vercel Deployment Protection (GATE 2).** Opening the Preview URL redirects to the Vercel login, which the agent may not complete. `vercel curl` (CLI 60.1.1, beta) auto-generated a **Protection Bypass for Automation** token on the project, then failed locally (HTTP 000 on Windows). Owner: revoke it under Project Settings > Deployment Protection if unwanted. The Preview fallback run needs the owner signed in to Vercel.
31. **Security incident: key-shaped string in a test (2026-09-25).** GitHub secret scanning flagged a Google API key at `src/lib/judge/__tests__/route.test.ts` line 8, introduced in commit `41ce673` (task 2.1). The string was a fabricated test fixture written by the agent (the Google key prefix + 35 characters, i.e. the real Google key shape); the real key was only ever read from `.env.local` at runtime and was never written to a file. Response: the owner rotated the key anyway (old key deleted in Google AI Studio; new key in `.env.local` and Vercel Production). The fixture was replaced with `"test-key-not-real"`; the whole working tree and every tracked file were searched for the Google key prefix and other secret shapes (GitHub, OpenAI, AWS, Slack, Vercel tokens, private-key blocks, `GEMINI_API_KEY=` values): no hits remain, and no `.env` file is tracked. A new absolute rule (Section 12 and CLAUDE.md) bans real or realistic keys in any file. The old fake string still exists in git history (commit `41ce673`); it is not a credential, so history was not rewritten; the GitHub alert can be closed as "used in tests". Production redeploy verified with the new key (see Test log).
32. **Protection Bypass token revoked by the owner** (see 30). The owner will run the Preview (no-key) checklist steps 1-6 and report back; GATE 2 stays open until then.
33. **`/api/judge` rate limit (2.6 item 4) is per-instance best effort.** In-memory sliding window keyed by client IP; separate Vercel instances and cold starts each keep their own counts, so a determined client can exceed 20/10 min across instances. Good enough to stop a runaway tab or casual abuse of the free-tier key; not a security boundary. 11.3 updated.
34. **Git history is NOT rewritten (owner decision, 2.6 item 6).** The key-shaped fake fixture from `41ce673` stays in history. It was never a credential, the real key was rotated anyway, and a force-push rewrite of `main` would break the Vercel deployment links, the commit hashes logged in this section, and anyone's existing clones. The GitHub secret-scanning alert is closed as "used in tests".

35. **Concealment amendment (3.3).** With the 9.1 rule as written, an old ink pixel was "still visible" whenever the new pixel kept its color, so black ink painted solidly over the black CRYSTAL letters counted as not hidden, and the dark cover-up Tino asks for could never score full concealment. Fix, in the pure function with tests: a same-color pixel is visible only if its outline survives (a nearby pixel that contrasted with it in the old stencil still contrasts in the new one, radius 6 at 512). All 13.1 cases still hold (identical -> 0, black over red -> 1, half -> 0.5), plus new tests: untouched black letters 0, black fill with margin 1, black letters on a new red background 0, half fill ~0.45, JPEG noise. PRD 9.1 item 7 updated.
36. **Themed rail labels were not in the code.** The brief for Phases 3-5 said "Rail labels are already themed: verify only", but `src/lib/editorConfig.ts` on `main` has no `translations` (they were only runtime-tested in Phase 0). Implemented in 3.6.

### Phase 3 backlog
<!-- Agent: items to build in Phase 3, logged before the phase starts -->
- **Script color hint (from 2.2 finding 27).** The editor's Text tool ("Script" after 3.6 relabel) takes the current brush color, usually red, so players type CRYSTAL in red and lose half the palette points. Add a line to the order checklist (`src/components/OrderChecklist.tsx`, shown on ORDER and pinned in STUDIO): "Tip: set your Script color before typing."

### Discoveries
<!-- Agent: API facts verified in node_modules or docs, gotchas confirmed -->
**Gemini API, verified 2026-09-25 (task 2.0) against ai.google.dev and 6 live calls:**
- Docs: models page (updated 2026-09-24) lists stable Flash models `gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite` (all take images); 2.5 is closed to new projects. Pricing page: all four candidates are free of charge on the free tier. Newer guides use the Interactions API (`/v1beta/interactions`); `models.generateContent` is still documented with no deprecation notice.
- Endpoint used: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`, key in the `x-goog-api-key` header (works; keeps the key out of URLs). Body: `systemInstruction.parts[].text`, `contents[].parts[]` with `inline_data {mime_type, data}`, `generationConfig.responseMimeType: "application/json"` + `responseSchema` (OpenAPI subset, `nullable: true`, `enum` accepted), `generationConfig.thinkingConfig.thinkingLevel`.
- Response: JSON text at `candidates[0].content.parts[].text`; parts also carry a `thoughtSignature` key, so read only `text` fields. `finishReason: STOP`. ~2.4k prompt tokens for two 512px images.
- Timings (stencil + composite of a red heart with black CRYSTAL on forearm-deep): `gemini-3.5-flash-lite`, thinkingLevel `minimal` (accepted): 3065 / 2165 / 1987 ms, all 200, lettering "CRYSTAL", letteringMatch true, motifMatch true, mood thrilled. `gemini-3.8-flash`, thinkingLevel `low` (docs: minimal not supported): 503 UNAVAILABLE "high demand" x3 (3227 / 2683 / 3797 ms). 2 of 8 approved calls unused.
- **Decision (owner rule: fastest model that reads CRYSTAL from the stencil in < 4 s): default `GEMINI_MODEL` = `gemini-3.5-flash-lite`, `thinkingLevel: "minimal"`.** Override with the `GEMINI_MODEL` env var.
- The deep-skin composite makes black lettering low-contrast (seen in the probe image), which confirms flag 3: judge lettering from the stencil.
Full details in `NOTES.md`. Highlights:
- `@unlayer/react-image-editor` 1.0.2, `@unlayer/types` 1.448.0; runtime bundle is CDN `image-editor/2.12.0/editor.js`.
- **Save format follows input transparency:** opaque white stencil → `image/jpeg` 1024x1024; transparent PNG input → `image/png` with alpha preserved (both `onSave` and `getImage()`). Pipeline thresholds must tolerate JPEG ringing.
- Saving with the Draw panel open includes the stroke. Filter/crop panel commit (14.2) still to verify in task 1.5.
- `translations`, `theme`, `locale` update live without remount. "Flash Sheet" truncates in the rail ("Flash Sh...").
- All 8 tools show in the rail by default; no AI panel with `features.ai: false`.

### Test log
<!-- Agent: date, command, pass/fail count -->
- 2026-09-25 · `npm run typecheck` pass · `npm run lint` pass (0 problems) · `npm run build` pass · no Vitest suite yet (Phase 1.3)
- 2026-09-25 · Manual (Chromium, dev): editor renders on white stencil, 8 tools in rail, draw + Save shows preview; transparency test per NOTES.md c)
- 2026-09-25 · Manual (Chromium, https://inked-in-leonida.vercel.app): editor renders, 8 tools in rail, no AI panel, draw + Save shows 1024x1024 preview, no error banner. GATE 0 pass.
- 2026-09-25 · 1.1 · typecheck pass · lint pass
- 2026-09-25 · 1.2 · typecheck pass · `npm run test` 3/3 pass · lint pass
- 2026-09-25 · 1.3 · typecheck pass · `npm run test` 65/65 pass (3 files, incl. +/-12 JPEG noise suite) · lint pass
- 2026-09-25 · 1.4 · typecheck pass · test 65/65 · lint pass · browser: ORDER shows badge, bio, request, 5-row checklist for tino-1
- 2026-09-25 · 1.5 · typecheck pass · test 65/65 · lint pass · browser (dev): tino-1 rail = Filter, Crop, Draw, Text, Shapes, Stickers (Resize/Frame hidden); empty Transfer and empty Save both shake/toast; stroke + Save -> PLACEMENT; stroke + Transfer button -> PLACEMENT; 14.2 probes per NOTES.md
- 2026-09-25 · 1.6 · typecheck pass · test 65/65 · lint pass · browser (dev): forearm-deep PNG body + heart stencil; drag, Left x3, Shift+Down, size 0.56x, rotate 95° all applied; dashed zone + "Inside left forearm"; ink clipped at the arm edge; outside-body pixel [0,0,0,0], skin pixel = #6B4430
- 2026-09-25 · 1.7 · typecheck pass · test 65/65 · lint pass · browser (dev): outline heart via Save -> Lock it in -> JobResult: composite image/png 1000x1250 (toDataURL no taint), stencil image/jpeg, breakdown palette 12.5 / coverage 0 (outline < 4%) / placement 10 / motif 15 / lettering 15 = 53, 2 stars, angry, tip $70, source fallback. 512 JPEG built by the same call (used from Phase 2).
- 2026-09-25 · 1.8 · typecheck pass · test 65/65 · lint pass · browser (dev): filled red heart -> VERDICT shows composite, MEH badge, 3 stars, tip $110, Score 68/100, bars Palette 12.5/25, Size 15/15, Placement 10/10, Motif 15/25, Lettering 15/25; Restart shift -> ORDER with results cleared
- 2026-09-25 · 1.9 · typecheck pass · test 65/65 · lint pass · browser (dev): progress Order -> Stencil -> Placement -> Verdict via our Transfer button; scroll resets to top; unreachable screen shows diegetic fallback with a way back
- 2026-09-25 · GATE 1 · `npm run typecheck` pass · `npm run lint` pass · `npm run test` 65/65 (3 files) · `npm run build` pass (dev-only store handle absent from prod chunks) · deployed `vercel --prod` -> https://inked-in-leonida.vercel.app · live run: ORDER -> STUDIO (rail Filter/Crop/Draw/Text/Shapes/Stickers, no AI panel, empty Transfer toast) -> filled red heart + editor Save -> PLACEMENT (zone "Inside left forearm") -> Lock it in -> VERDICT 68/100, 3 stars, 5 breakdown bars; 0 console errors. Drawing was driven by synthetic pointer events (the browser pane's screenshots crop at DPR 1.5); owner to confirm with a real mouse.
- 2026-09-25 · 2.0 · 6 live generateContent calls (3x gemini-3.5-flash-lite minimal: 200, 3065/2165/1987 ms, CRYSTAL read 3/3; 3x gemini-3.8-flash low: 503 x3). No repo code; probe script and images stayed in the session scratchpad.
- 2026-09-25 · 2.1 · typecheck pass · lint pass · `npm run test` 129/129 (5 files; judge: request/verdict validation, sanitizer, prompt, JUDGE_FORCE ignored in production, route: success, header auth, schema, labelled images, server-side order, cache, no key, HTTP 400/403/429/500/503, bad JSON/fields/mood, network error, 8 s timeout with fake timers, bad requests; afterEach asserts no image data or key in any log line) · local dev route with the real key: 200 vision (CRYSTAL, letteringMatch true) ~3.8 s incl. first compile, cached repeat 32 ms, bad body 200 fallback; server log shows only "[judge] fallback: bad-request"
- 2026-09-25 · 2.2 · typecheck pass · lint pass · test 142/142 (6 files; finishJob: vision 100/5★/thrilled/$180, fallback 80/4★, wrong lettering 10, offensive 0/refusal/$0, cover-up 100; client: validated vision, fallback on server fallback / malformed / non-JSON / 500 / network error, 9 s cap with fake timers; store inking transitions) · dev with key: canvas stencil (red heart + black CRYSTAL) -> PLACEMENT -> INKING -> VERDICT in ~4.0 s, source vision, 100/100, 5 stars, $180 · dev with key, real editor: Text tool "CRYSTAL" + drawn heart -> lettering 25/25, motif 25/25; palette 12.5 because the Text tool's default fill was red (no black), which is correct scoring
- 2026-09-25 · 2.3 · typecheck pass · lint pass · test 165/165 (7 files; pickReaction all 16 score/model mood combos, empty/whitespace/no model line, trim; finishJob: model line within one step, canned line when two steps away, offensive never uses the model line) · dev with key: tino-1 100/5★ thrilled, VERDICT shows the model line "Crystal is gonna love this, looks smooth like a fresh fiberglass hull!"
- 2026-09-25 · 2.4 · typecheck pass · lint pass · test 166/166 (store startOver; finishJob offensive flag) · dev with JUDGE_FORCE=offensive (port 3001): real editor stroke -> Save -> Lock it in -> VERDICT 0/100, 1 star, ANGRY, refusal line, $0, alert "Tino won't wear that...", button "Start over" -> STUDIO for tino-1, fresh blank editor, result + draft cleared · dev with JUDGE_FORCE=slow (port 3002, server holds 12 s): INKING gave up at 9.1 s -> VERDICT fallback 80, canned line
- 2026-09-25 · 2.5 · typecheck pass · lint pass · test 166/166 · dev with key: vision verdict 100/100 shows no tag; same result with source fallback shows "Client squinted at it."
- 2026-09-25 · GATE 2 (partial) · typecheck pass · lint pass · test 166/166 (7 files) · build pass (`/api/judge` dynamic) · client bundle scan: 0 files contain GEMINI, the Google key prefix, generativelanguage, x-goog-api-key, JUDGE_FORCE, __game, or the actual key value · `phase-2` pushed -> Preview https://inked-in-leonida-re3kw0h7g-bholdguys-projects.vercel.app (Vercel login wall, not yet played) · `main` fast-forwarded to d862afc -> Production deployed · production API: probe images -> 200 vision CRYSTAL 3.7 s cold; bad input -> 200 fallback · production UI, real editor (Draw heart, brush default red; Text tool Heading, FILL set to black preset, typed CRYSTAL; editor Save; Lock it in): PLACEMENT -> INKING -> VERDICT in 4.2 s, 100/100, 5 stars, THRILLED, $180, all five bars full, drawing-specific model line, no fallback tag
- 2026-09-26 · security fix `f7d339d` · typecheck pass · lint pass · test 166/166 · tracked-file + working-tree scan: no Google key prefix, no other secret shapes, no tracked .env · production redeploy of f7d339d with the rotated key: one /api/judge call -> 200, source "vision", CRYSTAL read, 3.9 s
- 2026-09-26 · 2.6 item 1 (editor load timeout) · typecheck pass · lint pass · test 166/166 · browser (dev), CDN embed script rerouted to a non-routable host (hang): loading line "Setting up the stencil paper..." + Transfer disabled at 1.5 s, still loading at ~12 s, POWER'S OUT at ~17 s (15 s after mount); block removed + Retry -> editor in 1.9 s via `embed.js?retry=1`, loading line gone, Transfer enabled · embed script rerouted to a 404: POWER'S OUT in 0.9 s via onError; Retry loads the editor
- 2026-09-26 · 2.6 item 2 (error boundaries) · typecheck pass · lint pass · test 166/166 · browser (dev): malformed result (breakdown null) on VERDICT -> error.tsx "Something shorted out in the shop."; Restart shift -> ORDER with results cleared. global-error.tsx is production-only (checked by build)
- 2026-09-26 · 2.6 item 3 (dead ends) · typecheck pass · lint pass · test 169/169 (safeFinish: good verdict passes; merge throws -> canned fallback 80; fallback throws -> null) · browser (dev): VERDICT with no result -> "No verdict yet." + Back to the order -> ORDER; INKING with unscorable data -> "The needle jammed mid-line." + Back to placement -> PLACEMENT; tino-2 with a corrupt start image -> "Stencil paper jammed" -> Retry reset the image (instance present) and re-jammed, Retry still offered. The no-instance remount branch is not reachable from outside the component; verified by code review only
- 2026-09-26 · 2.6 item 4 (rate limit) · typecheck pass · lint pass · test 177/177 (limiter: 20 then block, per-key isolation, sliding window edge at exactly 10 min, blocked attempts do not extend the window, reset; clientIp: x-forwarded-for first entry, x-real-ip, unknown; route: 20 allowed incl. cached, 21st 200 fallback with "rate-limited" log reason, another IP unaffected)
- 2026-09-26 · 2.6 item 5 (footer) · typecheck pass · lint pass · test 177/177 · dev page HTML contains the new footer text
- 2026-09-26 · 2.6 item 6 (housekeeping) · typecheck pass · lint pass · test 182/182 (zoneHit: inside, outside, null zone always hits; verdictFor: 100/80/60/10 -> stars, mood, tip; offensive overrides to 1 star, angry, $0 even at score 100)
- 2026-09-26 · 2.6 final check · typecheck pass · lint pass · test 182/182 (8 files) · build pass · client bundle: 0 files with GEMINI, the Google key prefix, generativelanguage, x-goog-api-key, JUDGE_FORCE, __game, or the actual key value · tracked files: no Google key prefix · dev regression with key: tino-1 100/100, 5 stars, thrilled, $180, new footer shown
- 2026-09-26 · GATE 2 PASSED · Preview (no key, https://inked-in-leonida-a0smniq4y-bholdguys-projects.vercel.app), owner run: loading line + greyed Transfer shown, new footer shown, VERDICT "Client squinted at it." with a canned Tino line, Motif 15/25, Lettering 15/25, 78/100, 4 stars, HAPPY, $145 · Production (key): agent run 2026-09-25 via real editor 100/100, 5 stars, drawing-specific reaction; 2.6 re-check 2026-09-26 /api/judge 200 vision
- 2026-09-26 · 3.0 · typecheck pass · lint pass · test 188/188 (9 files; flow: 8.1 order, 9.3 callback lines; store: full shift walk, stable finale job, finale -> SELF_REVEAL, reset keeps sound)
- 2026-09-26 · 3.1 · browser (dev, key set): TITLE -> tino-1 (canvas-injected stencil via dev handle) 100/100 vision -> "Next client" -> kaylee-1 ORDER (Night 1, pink + orange, STAY LOUD) -> PLACEMENT on shoulder-light -> INKING -> VERDICT 75/100 vision (palette 25, size 15, placement 10, lettering 25, motif 0 for a crude palm), "Next client" shown
- 2026-09-26 · 3.2 · typecheck pass · lint pass · browser (dev): kaylee-1 4 stars -> Next client -> "NIGHT 2 · 12:10 AM / Somebody's back. / Kaylee's post hit 40K likes. Your DMs are on fire." -> auto-advanced to tino-2 ORDER after 2.5 s
- 2026-09-26 · 3.3 · typecheck pass · lint pass · test 194/194 (10 files; +5 concealment outline cases, +1 route: tino-2 prompt says "The old tattoo said \"CRYSTAL\"" even when the client sends oldLettering "HACKED", oldTextReadable false passed through) · browser (dev, real editor, synthetic pointer events): **JPEG path** tino-1 red strokes + black Heading text -> editor Save -> `image/jpeg` 1024x1024, placement 0.8x / 25° -> tino-2 editor rail Filter/Draw/Text/Shapes/Stickers (no Crop, no Resize), `getImage()` of the fresh cover-up editor vs stored stencil: 1024x1024 both, max pixel diff 0; whole stencil painted black -> Save -> PLACEMENT defaulted to 0.8x / 25° (tino-1's) -> concealment 40/40, old name 20/20, palette 15/15, 90/100 (judge timed out at 8 s -> fallback, "Crystal who? Never heard of her.") · **PNG path** tino-1 via our Transfer button -> `image/png` 1024x1024 -> cover-up editor max pixel diff 0; left half painted black -> Transfer button -> concealment 2.24/40 (~0.56 hidden), vision oldTextReadable false -> 20/20, 37/100
- 2026-09-26 · 3.4 · typecheck pass · lint pass · test 195/195 (+finishFree) · browser (dev, real editor): tino-2 VERDICT -> Next client -> FINALE_INTRO -> Sit down -> SELF_SETUP Back + Light (two quick clicks both stick, after a stale-closure fix) -> STUDIO rail shows all 8 tools (Filter, Crop, Resize, Draw, Text, Shapes, Stickers, Frame) -> Draw strokes + editor Save -> PLACEMENT with no dashed zone -> Lock it in -> INKING -> SELF_REVEAL on back-light, 0 calls to /api/judge (fetch counted)
- 2026-09-26 · 3.5 · typecheck pass · lint pass · test 201/201 (11 files; wall: round trip, storage throwing on every call, no storage, corrupt JSON / wrong shape / non-image thumb rejected; totalTips; shopRating one decimal and empty) · browser (dev): SELF_REVEAL -> Hang it on the wall -> SHOP_WALL $430, 3.0★, 4 frames -> localStorage entry 21 KB (thumbs 4-6 KB) -> Restart shift -> TITLE "Last shift: $430 in tips · 3.0★ shop rating"; with `window.localStorage` redefined to throw SecurityError: TITLE renders without the last-shift line, SHOP_WALL renders and saves nothing, 0 page errors
- 2026-09-26 · 3.6 · typecheck pass · lint pass · test 204/204 (12 files) · browser (dev): tino-1 rail reads Ink Age, Trim, Needle, Script, Stencil, Flash; toolbar Save reads "Transfer Stencil"; every label scrollWidth == clientWidth (no truncation)

---

## 17. README requirements

Sections, in order:
1. Title, tagline, live URL, 15s GIF or screenshot.
2. "Why": the three player complaints (Section 2) in 3 short lines.
3. How to play (5 bullets).
4. **How React Image Editor is used**: a table with every integration point and file path: per-job `features.imageEditor.tools`, `translations`, `theme`, `image` start states including the cover-up stencil, `onSave` pipeline, `ref.hasChanges()` guard, `ref.getImage()`, `ref.reset()` retry, `onLoadError`, `onError`. Judges score this criterion directly.
5. The ink pipeline (whiteToAlpha -> placement -> multiply composite) and the scoring table.
6. Run locally, env vars.
7. Credits + disclaimer: "Unofficial fan project. Not affiliated with or endorsed by Rockstar Games or Take-Two Interactive. All art is original. Built with Unlayer React Image Editor. #BuiltWithImageEditor"

---

## 18. Demo script (90 seconds, owner records)

1. 0-8s: Title sign flickers on. "Their parlor is a menu. This one isn't."
2. 8-30s: Tino's order. Quick heart + CRYSTAL lettering in the editor. Transfer.
3. 30-40s: Drag it anywhere on the arm, rotate, lock in. Needle sweep.
4. 40-50s: Tino's reaction + score breakdown.
5. 50-58s: "Night 2. Somebody's back." Tino: "Crystal took the boat."
6. 58-75s: The editor opens on YOUR old tattoo. Paint a panther over it. Concealment score.
7. 75-85s: Last chair is yours. Quick self-ink on the back.
8. 85-90s: Shop wall. InkGram card. #BuiltWithImageEditor.

---

## 19. Submission checklist

- [ ] Public GitHub repo with README (Section 17)
- [ ] Live Vercel URL works in a private browser window
- [ ] Editor is a core part (it is the only authoring tool)
- [ ] Users edit at least one visual (they edit four)
- [ ] Form submitted: http://forms.gle/QxJSXeASJXJrW51y9
- [ ] X post with demo video, live URL, #BuiltWithImageEditor, tag @unlayer
- [ ] Submitted before Sunday Sep 27, 23:59 UTC
