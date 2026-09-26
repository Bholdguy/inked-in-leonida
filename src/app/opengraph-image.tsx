import { ImageResponse } from "next/og";

// Share preview (PRD 5.2): the neon sign over a banded sunset, rendered at build time.
export const alt = "Inked in Leonida: a neon night-shift tattoo parlor game built with Unlayer React Image Editor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const bands = Array.from({ length: 11 }, (_, i) => i);

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          backgroundColor: "#0b0714",
          backgroundImage: "radial-gradient(ellipse at 15% 0%, #3a1030 0%, #0b0714 55%)",
          color: "#fff5fb",
          fontFamily: "sans-serif",
        }}
      >
        {/* Banded sunset disc */}
        <div
          style={{
            position: "absolute",
            top: 70,
            left: 360,
            width: 480,
            height: 480,
            borderRadius: 9999,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            opacity: 0.6,
          }}
        >
          {bands.map((i) => (
            <div
              key={i}
              style={{
                height: 30,
                marginBottom: 14,
                background: ["#ffd36e", "#ffb45a", "#ff9a45", "#ff8a3d", "#ff6f60", "#ff5a78", "#ff3e9a", "#e0368e", "#b82b86", "#8f2480", "#7a1f7a"][i],
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 34, letterSpacing: 18, color: "#effffd", textShadow: "0 0 12px #19e3d1, 0 0 28px #19e3d1", fontWeight: 800 }}>
          INKED IN
        </div>
        <div
          style={{
            fontSize: 150,
            fontWeight: 900,
            letterSpacing: 8,
            lineHeight: 1,
            textShadow: "0 0 10px #ff3e9a, 0 0 30px #ff3e9a, 0 0 70px #ff3e9a",
          }}
        >
          LEONIDA
        </div>
        <div style={{ marginTop: 34, fontSize: 32, color: "#f4ede4" }}>Night shift on the strip.</div>
        <div style={{ marginTop: 6, fontSize: 32, color: "#ff8a3d" }}>Their parlor is a menu. This one isn&apos;t.</div>
        <div style={{ position: "absolute", bottom: 30, fontSize: 22, color: "#19e3d1", letterSpacing: 2 }}>
          Built with Unlayer React Image Editor · #BuiltWithImageEditor
        </div>
      </div>
    ),
    size,
  );
}
