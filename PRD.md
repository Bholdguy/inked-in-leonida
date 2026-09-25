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
2. `whiteToAlpha(img, lo = 225, hi = 245) -> RGBAImage`: luminance L = 0.2126R + 0.7152G + 0.0722B. If L >= hi, alpha = 0. If L <= lo, alpha unchanged. Between: alpha scales linearly to 0. Saturated light colors (HSL s > 0.35) are NEVER stripped, so pastel pink survives.
3. `inkMask(img) -> Uint8Array`: 1 where alpha > 32 after whiteToAlpha.
4. `coverage(mask) -> number`: ink pixels / total pixels, measured on the 512x512 normalized stencil mask (not the composite).
5. `classifyColor(r, g, b) -> ColorName`: convert to HSL.
   - l < 0.18, or (s < 0.18 and l < 0.6): `black`
   - s < 0.18: `black` (grays count as black ink)
   - hue 345-15: `red` (but if l > 0.68: `pink`)
   - 15-40: `orange` · 40-65: `yellow` · 65-170: `green` · 170-260: `blue` · 260-300: `purple` · 300-345: `pink`
6. `colorShare(img, mask) -> Record<ColorName, number>`: fraction of ink pixels per color.
7. `concealment(oldImg, newImg) -> number` (cover-up only): for each old ink pixel, it is "still visible" if the new pixel's RGB euclidean distance to the old pixel is < 40. Return 1 - visible / oldInkCount.
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
  "mode": "standard",
  "order": { "motif": "heart", "lettering": "CRYSTAL", "requiredColors": ["red", "black"] },
  "compositeJpegB64": "<512px jpeg, no data: prefix>",
  "oldLettering": null
}
```

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

- Env: `GEMINI_API_KEY` (server only), `GEMINI_MODEL` (default to a current Flash model; verify the name against Google's docs at build time).
- Use the REST `generateContent` endpoint with JSON response mode. Validate the returned JSON by hand (type checks per field); on mismatch return fallback.
- Truncate `reaction` to 140 chars. Strip anything that is not plain text.
- Cache by SHA-256 of the image in a module-level Map (best effort, per instance).
- MUST NOT log image data. MUST NOT expose the key to the client.

**Vision system prompt (use verbatim, fill the brackets):**
```
You are judging a tattoo in a comedy tattoo-parlor game. You see a tattoo on skin.
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
- [ ] 1.2 zustand store: screen, jobIndex, per-job results, sound flag
- [ ] 1.3 Pure ink functions (9.1) + Vitest tests (Section 13.1)
- [ ] 1.4 ORDER screen
- [ ] 1.5 STUDIO with per-job tool config and Transfer + hasChanges guard
- [ ] 1.6 PLACEMENT with placeholder body PNG (`public/bodies/`), drag/size/rotate, target zone
- [ ] 1.7 Compositing (11.2)
- [ ] 1.8 VERDICT with deterministic parts; motif/lettering use fallback values
- [ ] 1.9 Minimal routing between screens for tino-1

**GATE 1:** On the deployed URL, a person can go ORDER -> STUDIO -> PLACEMENT -> VERDICT for Tino and see a score breakdown. Tests pass.

### Phase 2: The judge (Sat morning, ~3h)
- [ ] 2.1 `/api/judge` route per 11.3 with timeout, validation, cache, fallback
- [ ] 2.2 Client call from INKING; merge into score per 9.2
- [ ] 2.3 Canned lines (Section 15.2) + mood consistency rule
- [ ] 2.4 Offensive path -> "Start over"
- [ ] 2.5 "Client squinted at it" tag on fallback

**GATE 2:** With the key set, reactions are specific to the drawing. With the key removed, the game still completes with canned lines. Both verified on Vercel (use a Preview deployment without the env var).

### Phase 3: Full content loop (Sat afternoon, ~5h)
- [ ] 3.1 kaylee-1 job with shoulder placeholder
- [ ] 3.2 NIGHT_INTRO screens + Kaylee callback (9.3)
- [ ] 3.3 tino-2 cover-up: start image = tino-1 stencil, crop/resize off, concealment scoring
- [ ] 3.4 FINALE_INTRO, SELF_SETUP, SELF_REVEAL
- [ ] 3.5 SHOP_WALL with localStorage persistence
- [ ] 3.6 Themed labels (10.3) or legend fallback

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

### Current task
<!-- Agent: one task ID -->
- 1.2 zustand store

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

### Discoveries
<!-- Agent: API facts verified in node_modules or docs, gotchas confirmed -->
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
