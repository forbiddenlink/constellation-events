import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Constellation - Astronomy Event Tracker";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0e17 0%, #050A14 50%, #020204 100%)",
          position: "relative"
        }}
      >
        {/* Nebula gradient overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(circle at 30% 20%, rgba(56, 189, 248, 0.15) 0%, transparent 40%), radial-gradient(circle at 70% 80%, rgba(129, 140, 248, 0.12) 0%, transparent 35%)",
            display: "flex"
          }}
        />

        {/* Star field effect - scattered dots */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex"
          }}
        >
          {/* Static star positions for consistent rendering */}
          {[
            { x: 100, y: 80, size: 2 },
            { x: 200, y: 150, size: 3 },
            { x: 350, y: 50, size: 2 },
            { x: 450, y: 200, size: 2 },
            { x: 600, y: 100, size: 3 },
            { x: 750, y: 180, size: 2 },
            { x: 900, y: 60, size: 2 },
            { x: 1000, y: 130, size: 3 },
            { x: 1100, y: 90, size: 2 },
            { x: 150, y: 450, size: 2 },
            { x: 280, y: 520, size: 3 },
            { x: 420, y: 480, size: 2 },
            { x: 580, y: 550, size: 2 },
            { x: 720, y: 470, size: 3 },
            { x: 880, y: 530, size: 2 },
            { x: 1050, y: 490, size: 2 }
          ].map((star, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: star.x,
                top: star.y,
                width: star.size,
                height: star.size,
                borderRadius: "50%",
                background: "rgba(248, 250, 252, 0.6)",
                boxShadow: "0 0 4px rgba(248, 250, 252, 0.4)"
              }}
            />
          ))}
        </div>

        {/* Constellation icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #38bdf8 0%, #818CF8 100%)",
            marginBottom: 24,
            boxShadow: "0 0 40px rgba(56, 189, 248, 0.4)"
          }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            style={{ display: "flex" }}
          >
            <circle cx="12" cy="6" r="2" fill="#0a0e17" />
            <circle cx="6" cy="12" r="1.5" fill="#0a0e17" />
            <circle cx="18" cy="12" r="1.5" fill="#0a0e17" />
            <circle cx="12" cy="18" r="2" fill="#0a0e17" />
            <circle cx="8" cy="9" r="1" fill="#0a0e17" />
            <circle cx="16" cy="9" r="1" fill="#0a0e17" />
            <path
              d="M12 6L6 12M12 6L18 12M6 12L12 18M18 12L12 18M12 6L8 9M12 6L16 9"
              stroke="#0a0e17"
              strokeWidth="1"
              strokeOpacity="0.6"
            />
          </svg>
        </div>

        {/* Brand name */}
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#f8fafc",
            marginBottom: 16,
            textShadow: "0 0 40px rgba(56, 189, 248, 0.3)"
          }}
        >
          Constellation
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 400,
            color: "#38bdf8",
            letterSpacing: "0.05em",
            textTransform: "uppercase"
          }}
        >
          Your nightly mission control
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            display: "flex",
            alignItems: "center",
            gap: 12
          }}
        >
          <div
            style={{
              width: 40,
              height: 2,
              background: "linear-gradient(90deg, transparent, #38bdf8)",
              display: "flex"
            }}
          />
          <div
            style={{
              fontSize: 14,
              color: "rgba(248, 250, 252, 0.5)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              display: "flex"
            }}
          >
            Astronomy Event Tracker
          </div>
          <div
            style={{
              width: 40,
              height: 2,
              background: "linear-gradient(90deg, #38bdf8, transparent)",
              display: "flex"
            }}
          />
        </div>
      </div>
    ),
    {
      ...size
    }
  );
}
