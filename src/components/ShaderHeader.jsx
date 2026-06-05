import { ShaderAnimation } from "./ui/shader-lines"

// Pixel art logo recreated as SVG — faithful to the black/white pixel mark
function PixelLogo({ size = 120, color = "#ffffff" }) {
  // Each cell is S×S px. Grid is 20 cols × 20 rows.
  const S = size / 20
  // Pixel map: 1 = filled, 0 = empty  (20 wide × 20 tall)
  const map = [
    [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,0,0,0,0,0,0,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0],
    [0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0],
    [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
    [0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0],
    [0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,0,0,0,0,0,0,1,1,1,1,0,0,0],
    [0,0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
  ]

  const rects = []
  map.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell) rects.push(
        <rect key={`${r}-${c}`} x={c * S} y={r * S} width={S} height={S} fill={color} />
      )
    })
  )

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: "pixelated" }}
    >
      {rects}
    </svg>
  )
}

export default function ShaderHeader() {
  return (
    <header className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-black">

      {/* ── Shader background ── */}
      <ShaderAnimation />

      {/* ── Radial vignette ── */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 20%, rgba(0,0,0,0.92) 100%)",
        }}
      />

      {/* ── Bottom fade ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-10"
        style={{ background: "linear-gradient(to bottom, transparent, black)" }}
      />

      {/* ── Content ── */}
      <div className="relative z-20 flex flex-col items-center gap-7 px-6 text-center">

        {/* Logo pixel art */}
        <div className="relative flex items-center justify-center">
          <div
            className="absolute blur-2xl opacity-25 w-40 h-40 rounded-full"
            style={{ background: "white" }}
          />
          <PixelLogo size={100} color="#ffffff" />
        </div>

        {/* Text identity */}
        <div className="flex flex-col items-center gap-2">
          <p
            className="text-[11px] font-bold tracking-[0.32em] uppercase"
            style={{ color: "#c8922a", fontFamily: "'Syne', sans-serif" }}
          >
            Romário Alves
          </p>
          <h1
            className="text-5xl md:text-[5.5rem] font-semibold tracking-tight text-white leading-[1.0]"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Design que{" "}
            <em className="italic" style={{ color: "#e8b86d" }}>
              acolhe
            </em>
          </h1>
          <p
            className="text-sm md:text-base max-w-sm mt-1 leading-relaxed"
            style={{ color: "rgba(240,228,204,0.5)", fontFamily: "'Syne', sans-serif", letterSpacing: "0.04em" }}
          >
            UX/UI · Hospitalidade · Interfaces sob medida
          </p>
        </div>

        {/* CTA */}
        <a
          href="#contact"
          className="mt-1 inline-flex items-center gap-3 px-7 py-3 text-[11px] font-bold uppercase transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
          style={{
            background: "#c8922a",
            color: "#0b0906",
            fontFamily: "'Syne', sans-serif",
            letterSpacing: "0.14em",
          }}
        >
          Iniciar conversa
          <span>→</span>
        </a>
      </div>

      {/* ── Scroll indicator ── */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        style={{ color: "rgba(240,228,204,0.35)", fontFamily: "'Syne', sans-serif" }}
      >
        <div
          className="w-px h-12"
          style={{ background: "linear-gradient(to bottom, #c8922a80, transparent)" }}
        />
        <span className="text-[9px] tracking-[0.22em] uppercase">Scroll</span>
      </div>

    </header>
  )
}
