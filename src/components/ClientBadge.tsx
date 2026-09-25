import type { Job } from "@/types";

export default function ClientBadge({ client, size = 72 }: { client: Job["client"]; size?: number }) {
  return (
    <div
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full border-2 font-bold tracking-wider"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        borderColor: client.accent,
        color: client.accent,
        background: `radial-gradient(circle at 30% 25%, ${client.accent}33, transparent 70%), var(--panel)`,
        boxShadow: `0 0 18px ${client.accent}55`,
      }}
    >
      {client.initials}
    </div>
  );
}
