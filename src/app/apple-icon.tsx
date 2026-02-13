import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "linear-gradient(135deg, #0f0a1e 0%, #1a1333 100%)",
          borderRadius: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Constellation pattern */}
        <svg
          width="140"
          height="140"
          viewBox="0 0 140 140"
          style={{ position: "absolute" }}
        >
          {/* Constellation lines */}
          <path
            d="M30,35 L70,55 L110,30"
            stroke="#22d3ee"
            strokeWidth="2"
            strokeOpacity="0.5"
            fill="none"
          />
          <path
            d="M70,55 L45,80 L50,115"
            stroke="#a78bfa"
            strokeWidth="2"
            strokeOpacity="0.5"
            fill="none"
          />
          <path
            d="M70,55 L95,75 L90,110"
            stroke="#22d3ee"
            strokeWidth="2"
            strokeOpacity="0.5"
            fill="none"
          />
          <path d="M45,80 L95,75" stroke="#a78bfa" strokeWidth="2" strokeOpacity="0.5" fill="none" />
          <path d="M50,115 L90,110" stroke="#22d3ee" strokeWidth="2" strokeOpacity="0.5" fill="none" />
        </svg>

        {/* Stars */}
        <div
          style={{
            position: "absolute",
            top: 35,
            left: 30,
            width: 12,
            height: 12,
            background: "#f0f4ff",
            borderRadius: "50%",
            boxShadow: "0 0 12px #f0f4ff",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 30,
            right: 30,
            width: 10,
            height: 10,
            background: "#f0f4ff",
            borderRadius: "50%",
            boxShadow: "0 0 10px #f0f4ff",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 55,
            left: "50%",
            marginLeft: -8,
            width: 16,
            height: 16,
            background: "#f0f4ff",
            borderRadius: "50%",
            boxShadow: "0 0 16px #22d3ee",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 80,
            left: 45,
            width: 11,
            height: 11,
            background: "#f0f4ff",
            borderRadius: "50%",
            boxShadow: "0 0 11px #f0f4ff",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 75,
            right: 45,
            width: 11,
            height: 11,
            background: "#f0f4ff",
            borderRadius: "50%",
            boxShadow: "0 0 11px #f0f4ff",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 30,
            left: 50,
            width: 10,
            height: 10,
            background: "#f0f4ff",
            borderRadius: "50%",
            boxShadow: "0 0 10px #f0f4ff",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 25,
            right: 50,
            width: 12,
            height: 12,
            background: "#f0f4ff",
            borderRadius: "50%",
            boxShadow: "0 0 12px #f0f4ff",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
