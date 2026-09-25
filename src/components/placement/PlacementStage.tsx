"use client";

import { useEffect, useRef } from "react";
import { BODY_HEIGHT, BODY_WIDTH } from "@/data/bodies";
import { renderComposite } from "@/lib/ink/composite";
import { makeCanvas } from "@/lib/ink/dom";
import type { Placement, Rect } from "@/types";

interface Props {
  body: HTMLImageElement;
  tattoo: HTMLCanvasElement;
  placement: Placement;
  onMove: (cx: number, cy: number) => void;
  zone: Rect | null;
  zoneLabel: string | null;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export default function PlacementStage({ body, tattoo, placement, onMove, zone, zoneLabel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scratchRef = useRef<HTMLCanvasElement | null>(null);
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);

  // Live preview: the exact same compositing as the final output, once per frame.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    scratchRef.current ??= makeCanvas(BODY_WIDTH, BODY_HEIGHT);
    const frame = requestAnimationFrame(() => renderComposite(canvas, body, tattoo, placement, scratchRef.current!));
    return () => cancelAnimationFrame(frame);
  }, [body, tattoo, placement]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, cx: placement.cx, cy: placement.cy };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onMove(
      clamp01(drag.current.cx + (e.clientX - drag.current.x) / rect.width),
      clamp01(drag.current.cy + (e.clientY - drag.current.y) / rect.height),
    );
  };
  const endDrag = () => {
    drag.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.05 : 0.01;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    onMove(clamp01(placement.cx + m[0]), clamp01(placement.cy + m[1]));
  };

  return (
    <div
      role="application"
      aria-label="Tattoo placement. Drag, or use arrow keys to move; hold Shift for bigger steps."
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      className="relative aspect-[4/5] w-full max-w-[480px] cursor-grab touch-none select-none overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_50%_30%,#241838,var(--night))] focus-visible:outline-2 focus-visible:outline-teal active:cursor-grabbing"
    >
      <canvas ref={canvasRef} width={BODY_WIDTH} height={BODY_HEIGHT} className="absolute inset-0 h-full w-full" />
      {zone && (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-md border-2 border-dashed border-teal/70"
          style={{ left: `${zone.x * 100}%`, top: `${zone.y * 100}%`, width: `${zone.w * 100}%`, height: `${zone.h * 100}%` }}
        >
          {zoneLabel && (
            <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-night/80 px-1.5 py-0.5 text-[11px] uppercase tracking-wider text-teal">
              {zoneLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
