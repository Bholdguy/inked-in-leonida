import { describe, expect, it } from "vitest";
import { editorOptions, RAIL_LABELS, SAVE_LABEL } from "@/lib/editorConfig";

describe("editorOptions", () => {
  it("never enables the AI Assistant or sets a projectId", () => {
    for (const id of ["tino-1", "kaylee-1", "tino-2", "self"] as const) {
      const o = editorOptions(id) as Record<string, unknown>;
      expect(o.projectId).toBeUndefined();
      expect((o.features as { ai: unknown }).ai).toBe(false);
      expect(o.aiAssistantOpenState).toBe("closed");
      expect(o.theme).toBe("dark");
    }
  });

  it("follows the PRD 10.2 tool table", () => {
    const tools = (id: "tino-1" | "kaylee-1" | "tino-2" | "self") =>
      (editorOptions(id).features as { imageEditor: { tools: Record<string, boolean> } }).imageEditor.tools;
    expect(tools("tino-2")).toMatchObject({ crop: false, resize: false, frame: false, draw: true, text: true });
    expect(tools("tino-1")).toMatchObject({ crop: true, resize: false, frame: false });
    expect(Object.values(tools("self")).every(Boolean)).toBe(true);
  });

  it("relabels the rail with shop names of 8 characters or less, and Save as Transfer Stencil", () => {
    for (const label of Object.values(RAIL_LABELS)) expect(label.length).toBeLessThanOrEqual(8);
    const en = (editorOptions("tino-1").translations as { en: Record<string, string> }).en;
    expect(en["image_editor.tools.draw"]).toBe("Needle");
    expect(en["image_editor.tools.text"]).toBe("Script");
    expect(en["image_editor.toolbar.save"]).toBe(SAVE_LABEL);
    expect(en["image_editor.tools.resize"]).toBeUndefined(); // keeps the default "Resize"
  });
});
