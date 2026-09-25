import type { ImageEditorOptions } from "@unlayer/react-image-editor";
import type { JobId } from "@/types";

type Tool = "crop" | "resize" | "filter" | "draw" | "text" | "shapes" | "stickers" | "frame";

// PRD 10.2. Resize and frame make no sense on skin; crop is off in the cover-up because
// concealment compares pixels at the same coordinates. The finale unlocks everything.
const TOOLS: Record<JobId, Record<Tool, boolean>> = {
  "tino-1": { crop: true, resize: false, filter: true, draw: true, text: true, shapes: true, stickers: true, frame: false },
  "kaylee-1": { crop: true, resize: false, filter: true, draw: true, text: true, shapes: true, stickers: true, frame: false },
  "tino-2": { crop: false, resize: false, filter: true, draw: true, text: true, shapes: true, stickers: true, frame: false },
  self: { crop: true, resize: true, filter: true, draw: true, text: true, shapes: true, stickers: true, frame: true },
};

export function editorOptions(jobId: JobId): ImageEditorOptions {
  return {
    theme: "dark",
    // AI Assistant stays off: no projectId, features.ai false, panel closed.
    features: { ai: false, imageEditor: { tools: TOOLS[jobId] } },
    aiAssistantOpenState: "closed",
  };
}
