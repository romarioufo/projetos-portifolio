import ShaderHeader from "./components/ShaderHeader"

export default function HeaderDemo() {
  return (
    <div className="bg-black min-h-screen">
      <ShaderHeader />

      {/* Placeholder content below to simulate portfolio */}
      <div
        className="flex items-center justify-center h-40 text-center px-6"
        style={{ color: "rgba(240,228,204,0.3)", fontFamily: "'Syne', sans-serif", fontSize: "0.8rem", letterSpacing: "0.15em" }}
      >
        — PORTFOLIO CONTENT BELOW —
      </div>
    </div>
  )
}
