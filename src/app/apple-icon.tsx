import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 180,
  height: 180
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0e17 0%, #050A14 100%)",
          borderRadius: "22%"
        }}
      >
        {/* Inner glow circle */}
        <div
          style={{
            position: "absolute",
            width: 140,
            height: 140,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)",
            display: "flex"
          }}
        />

        {/* Constellation icon with gradient */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #38bdf8 0%, #818CF8 100%)",
            boxShadow: "0 0 30px rgba(56, 189, 248, 0.4)"
          }}
        >
          <svg
            width="70"
            height="70"
            viewBox="0 0 24 24"
            fill="none"
            style={{ display: "flex" }}
          >
            {/* Star points forming constellation */}
            <circle cx="12" cy="4" r="2" fill="#0a0e17" />
            <circle cx="4" cy="12" r="1.8" fill="#0a0e17" />
            <circle cx="20" cy="12" r="1.8" fill="#0a0e17" />
            <circle cx="12" cy="20" r="2" fill="#0a0e17" />
            <circle cx="7" cy="7" r="1.2" fill="#0a0e17" />
            <circle cx="17" cy="7" r="1.2" fill="#0a0e17" />
            <circle cx="7" cy="17" r="1.2" fill="#0a0e17" />
            <circle cx="17" cy="17" r="1.2" fill="#0a0e17" />
            <circle cx="12" cy="12" r="1.5" fill="#0a0e17" />

            {/* Connection lines */}
            <path
              d="M12 4L7 7M12 4L17 7M7 7L4 12M17 7L20 12M4 12L7 17M20 12L17 17M7 17L12 20M17 17L12 20M7 7L12 12M17 7L12 12M7 17L12 12M17 17L12 12"
              stroke="#0a0e17"
              strokeWidth="0.8"
              strokeOpacity="0.4"
            />
          </svg>
        </div>
      </div>
    ),
    {
      ...size
    }
  );
}
