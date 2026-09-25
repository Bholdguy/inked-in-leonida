"use client";

import { useEffect, useRef, useState } from "react";
import {
  ImageEditor,
  type ImageEditorOptions,
  type ImageEditorRef,
} from "@unlayer/react-image-editor";

// AI Assistant stays off: no projectId, features.ai false, panel closed.
const EDITOR_OPTIONS: ImageEditorOptions = {
  theme: "dark",
  features: { ai: false },
  aiAssistantOpenState: "closed",
};

export default function InkEditor() {
  const editorRef = useRef<ImageEditorRef>(null);
  const [image, setImage] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The editor runs from Unlayer's CDN, so hand it an absolute URL.
  useEffect(() => {
    setImage(`${window.location.origin}/stencils/blank.png`);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p role="alert" className="rounded border border-red-500 bg-red-950 px-4 py-3 text-red-200">
          {error}
        </p>
      )}

      {image && (
        <ImageEditor
          ref={editorRef}
          image={image}
          options={EDITOR_OPTIONS}
          minHeight={700}
          onSave={({ dataUrl }) => setSaved(dataUrl)}
          onLoadError={() => {
            console.error("[InkEditor] onLoadError: stencil image failed to load", image);
            setError("The stencil image failed to load into the editor.");
          }}
          onError={(err) => {
            console.error("[InkEditor] onError:", err);
            setError(`The editor failed to start: ${err.message}`);
          }}
        />
      )}

      {saved && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm uppercase tracking-widest text-neutral-400">Saved stencil</h2>
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL preview */}
          <img
            src={saved}
            alt="Saved stencil preview"
            className="max-w-md border border-neutral-700 bg-[repeating-conic-gradient(#333_0_25%,#222_0_50%)] bg-[length:20px_20px]"
          />
        </section>
      )}
    </div>
  );
}
