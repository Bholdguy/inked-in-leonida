# Inked in Leonida

A GTA VI-inspired tattoo parlor game for the Unlayer #BuiltWithImageEditor challenge.
You are the night-shift artist on the Leonida strip: design ink in Unlayer's React Image Editor, place it anywhere on a client's body, and get scored on the result.
Next.js 15 (App Router, `src/`), TypeScript, Tailwind v4, zustand, Vitest, deployed on Vercel.

## Rules (absolute)

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

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
```

## Workflow

PRD.md is the source of truth. Build one phase at a time. Stop at every GATE and report. Update PRD Section 16 after every task.
