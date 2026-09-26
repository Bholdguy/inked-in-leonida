import type { ColorName, Job } from "@/types";
import { sizeLabel, zoneLabel } from "@/data/jobs";

const SWATCH: Record<ColorName, string> = {
  black: "#111",
  red: "#DC1E28",
  pink: "#FF7FB6",
  orange: "#FF8C28",
  yellow: "#E6D21E",
  green: "#28B43C",
  blue: "#1E50DC",
  purple: "#8C28C8",
};

const pct = (v: number) => `${Math.round(v * 100)}%`;

export default function OrderChecklist({ job }: { job: Job }) {
  const size = sizeLabel(job.coverage);
  const zone = zoneLabel(job);
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Motif", value: job.motifOptions ? job.motifOptions.join(" / ") : job.motif ?? "Your call" },
    { label: "Lettering", value: job.lettering ? <span className="font-mono tracking-widest">{job.lettering}</span> : "None" },
    {
      label: "Colors",
      value: job.requiredColors.length ? (
        <span className="flex flex-wrap gap-2">
          {job.requiredColors.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-full border border-white/30" style={{ background: SWATCH[c] }} />
              {c}
            </span>
          ))}
        </span>
      ) : (
        "Any"
      ),
    },
    { label: "Placement", value: zone ?? "Anywhere" },
  ];
  if (size && job.coverage) {
    rows.push({ label: "Size", value: `${size} (${pct(job.coverage.min)}–${pct(job.coverage.max)} of the stencil)` });
  }

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="contents">
            <dt className="text-muted uppercase tracking-wider">{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
      {job.lettering && (
        // The Script tool takes the current brush color, so lettering typed after red strokes comes out red.
        <p className="text-xs text-sunset">Tip: set your Script color before typing.</p>
      )}
    </div>
  );
}
