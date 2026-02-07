export default function ConstellationViz() {
  return (
    <div className="glass relative h-72 overflow-hidden rounded-3xl p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(94,242,193,0.18),transparent_55%),radial-gradient(circle_at_80%_60%,rgba(123,140,255,0.2),transparent_50%)]" />
      <svg className="relative h-full w-full" viewBox="0 0 600 300" fill="none">
        <g stroke="rgba(232,241,255,0.45)" strokeWidth="1.5">
          <path d="M80 240 L140 170 L220 190 L280 130 L360 150 L430 110 L520 140" />
        </g>
        <g fill="#E8F1FF">
          <circle cx="80" cy="240" r="4" />
          <circle cx="140" cy="170" r="5" />
          <circle cx="220" cy="190" r="3" />
          <circle cx="280" cy="130" r="5" />
          <circle cx="360" cy="150" r="4" />
          <circle cx="430" cy="110" r="6" />
          <circle cx="520" cy="140" r="4" />
        </g>
        <g fill="rgba(94,242,193,0.6)">
          <circle cx="170" cy="80" r="2" />
          <circle cx="470" cy="70" r="2" />
          <circle cx="320" cy="40" r="2" />
        </g>
      </svg>
      <div className="relative mt-4 text-xs text-starlight/60">
        Live constellation overlay — AR-ready layout for Phase 2.
      </div>
    </div>
  );
}
