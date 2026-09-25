# Discovery notes (Phase 0)

Verified on 2026-09-25 against the installed packages, plus runtime tests in Chromium on the dev server.

- `@unlayer/react-image-editor` **1.0.2** (`node_modules/@unlayer/react-image-editor/dist/index.d.ts`, `dist/index.mjs`)
- `@unlayer/types` **1.448.0** (`node_modules/@unlayer/types/dist/editor/intl.d.ts`, `features.d.ts`)
- The editor itself loads from the CDN at runtime: `https://cdn.unlayer.com/image-editor/embed.js` → `image-editor/2.12.0/editor.js`

## a) `options.translations`: option keys

Type: `UnlayerTranslations = Partial<Record<UnlayerLocale, Partial<Record<UnlayerTranslationKey, string>>>>` (`intl.d.ts`).
So it is keyed by locale first, then by translation key:

```ts
options: {
  translations: { en: { "image_editor.tools.draw": "Needle" } },
  locale: "en", // optional; UnlayerLocale, e.g. "en", "es", "fr"
}
```

- `theme`, `locale`, `translations` are applied live via `editor.updateOptions()`; the wrapper does NOT remount for them (`index.mjs`: `const { theme, locale, translations, ...remountOptions } = options`).
- Every other option change remounts the editor (compared by `JSON.stringify`, not object identity).

## b) Tool label translation keys (`ImageEditorTranslationKey` in `intl.d.ts`)

| Tool | Translation key | Feature flag (`features.imageEditor.tools.*`) |
|---|---|---|
| crop | `image_editor.tools.crop` | `crop` |
| resize | `image_editor.tools.resize` | `resize` |
| filter | `image_editor.tools.filter` | `filter` |
| draw | `image_editor.tools.draw` | `draw` |
| text | `image_editor.tools.text` | `text` |
| shapes | `image_editor.tools.shapes` | `shapes` |
| stickers | `image_editor.tools.stickers` | `stickers` |
| frame | `image_editor.tools.frame` | `frame` |
| Save button | `image_editor.toolbar.save` | n/a |

- Tool flag type: `ImageEditorToolConfig = boolean | { enabled?: boolean; icon?: string }`.
- `features.imageEditor` can also be a plain `boolean`.
- Two more tool keys exist in translations but NOT in `Features.tools`: `image_editor.tools.merge`, `image_editor.tools.corners`. The rail shows only the 8 tools above.
- **Runtime-verified:** passing all 8 tool keys + `image_editor.toolbar.save` through `updateOptions({ translations: { en: {...} } })` relabels the rail and the Save button live. "Flash Sheet" is truncated in the rail ("Flash Sh...") — rail labels are capped at 8 characters (PRD 10.3). "Transfer Stencil" fits the Save button.

## c) Transparent PNG background on save

**Preserved.** Runtime test: a 256x256 PNG, left half fully transparent, right half opaque red, loaded as `image`, a stroke drawn across it, then Save:

- `onSave` → `dataUrl` is `image/png`, `blob.type` is `image/png`, 256x256, transparent corner pixel = `[0,0,0,0]`, red pixel = `[255,0,0,255]`.
- `editor.getImage()` → same result (PNG, alpha preserved).

**Caveat, important for the pipeline:** an opaque input (our white `stencils/blank.png`) is saved as **`image/jpeg`**, 1024x1024. So player stencils arrive as JPEG, with compression noise around strokes. `whiteToAlpha`, `classifyColor` and `concealment` must tolerate JPEG ringing.

**Follow-up test (alpha 250):** a white stencil at alpha 250 (not 255) still saves as `image/jpeg`, with the background flattened to `[250,250,250,255]`. So "nearly opaque" does not switch the output to PNG. Decision: keep the opaque alpha-255 stencil and make the pipeline JPEG-tolerant.

## Other API facts (for Phase 1)

- `ref` gives `{ editor: ImageEditorInstance | null }`, not the instance. `onLoad(editor)` gives the instance directly.
- `ImageEditorInstance`: `destroy()`, `getImage(): string | null`, `hasChanges(): boolean`, `updateOptions(partial)`, `reset(imageUrl?)`.
- `onSave({ dataUrl, blob })`, `onLoadError()` (image decode/CORS/404), `onError(err)` (embed script load, createEditor, or reset rejection). Without `onError` it falls back to `console.error`.
- Changing the `image` prop runs `reset(image)`.
- `features.ai` exists (`boolean | { enabled, assistant, ... }`), and `aiAssistantOpenState` defaults to `'open'`. We set `features: { ai: false }` and `aiAssistantOpenState: 'closed'`. No AI panel appears.
- Saving with the Draw panel still open includes the stroke in the output.

## Task 1.5 findings (CDN 2.12.0, runtime)

| Check | Result |
|---|---|
| `hasChanges()` on a fresh editor | `false` |
| `hasChanges()` after a stroke | `true` |
| `hasChanges()` **inside `onSave`** | **`false`** even after a stroke (it reads `true` again afterwards). Not usable as a Save-path guard. |
| `getImage()` format, opaque stencil | **`image/png`** (Save gives `image/jpeg` for the same image) |
| Filter preset (Invert) with the Filter panel still open | Included by both `getImage()` and Save. The filter half of gotcha 14.2 does not reproduce. |
| Crop aspect changed (16:9) but not applied, panel open | `getImage()` returns the **uncropped** 1024x1024. Save **commits** the crop (output 1024x576). The crop half of gotcha 14.2 is real for `getImage()`. |

Consequences in code: the editor's Save is the reliable path. Our "Transfer stencil" button keeps the PRD `hasChanges()` guard and tells players "Close the tool panel, then Transfer." Both paths also run an ink check (`coverage > 0` on the normalized stencil) before accepting the stencil. Stencils can be JPEG (Save) or PNG (button), square or not (crop): everything downstream decodes by data URL and letterboxes, so both work.
- The image URL is passed to the CDN editor; we use an absolute URL (`window.location.origin + "/stencils/blank.png"`). It loads without CORS issues on same origin.
