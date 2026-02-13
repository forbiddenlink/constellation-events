import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Constellation - Your window to the night sky";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0f0a1e 0%, #1a1333 50%, #0f0a1e 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background stars */}
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              background: "#f0f4ff",
              borderRadius: "50%",
              opacity: Math.random() * 0.5 + 0.3,
            }}
          />
        ))}

        {/* Aurora gradient overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "40%",
            background: "linear-gradient(180deg, rgba(34,211,238,0.15) 0%, transparent 100%)",
          }}
        />

        {/* Constellation pattern */}
        <svg
          width="300"
          height="200"
          viewBox="0 0 300 200"
          style={{ position: "absolute", top: 80, opacity: 0.6 }}
        >
          <path
            d="M50,50 L150,80 L250,40"
            stroke="#22d3ee"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M150,80 L100,130 L120,180"
            stroke="#a78bfa"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M150,80 L200,120 L180,170"
            stroke="#22d3ee"
            strokeWidth="2"
            fill="none"
          />
          <path d="M100,130 L200,120" stroke="#a78bfa" strokeWidth="2" fill="none" />
          <circle cx="50" cy="50" r="6" fill="#f0f4ff" />
          <circle cx="150" cy="80" r="8" fill="#f0f4ff" />
          <circle cx="250" cy="40" r="5" fill="#f0f4ff" />
          <circle cx="100" cy="130" r="5" fill="#f0f4ff" />
          <circle cx="200" cy="120" r="5" fill="#f0f4ff" />
          <circle cx="120" cy="180" r="4" fill="#f0f4ff" />
          <circle cx="180" cy="170" r="6" fill="#f0f4ff" />
        </svg>

        {/* Logo text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 160,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#f0f4ff",
              letterSpacing: "0.05em",
              textShadow: "0 0 40px rgba(34,211,238,0.5)",
            }}
          >
            Constellation
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#a78bfa",
              marginTop: 16,
              letterSpacing: "0.1em",
            }}
          >
            Your window to the night sky
          </div>
        </div>

        {/* Features */}
        <div
          style={{
            display: "flex",
            gap: 48,
            marginTop: 48,
            color: "#f0f4ff",
            fontSize: 18,
            opacity: 0.8,
          }}
        >
          <span>Real-time Sky Data</span>
          <span>•</span>
          <span>Aurora Forecasts</span>
          <span>•</span>
          <span>Dark-Sky Finder</span>
          <span>•</span>
          <span>Event Calendar</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
