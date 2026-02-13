import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "linear-gradient(135deg, #0f0a1e 0%, #1a1333 100%)",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Central star */}
        <div
          style={{
            width: 8,
            height: 8,
            background: "#f0f4ff",
            borderRadius: "50%",
            boxShadow: "0 0 8px #22d3ee",
          }}
        />
        {/* Surrounding stars */}
        <div
          style={{
            position: "absolute",
            top: 6,
            left: 8,
            width: 4,
            height: 4,
            background: "#f0f4ff",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 6,
            width: 3,
            height: 3,
            background: "#f0f4ff",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 10,
            width: 3,
            height: 3,
            background: "#f0f4ff",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 6,
            right: 8,
            width: 4,
            height: 4,
            background: "#f0f4ff",
            borderRadius: "50%",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
