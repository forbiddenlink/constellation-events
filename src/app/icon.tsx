import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 32,
  height: 32
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #38bdf8 0%, #818CF8 100%)",
          borderRadius: "20%"
        }}
      >
        {/* Simplified constellation pattern for small size */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          style={{ display: "flex" }}
        >
          {/* Main star points */}
          <circle cx="12" cy="5" r="2.5" fill="#0a0e17" />
          <circle cx="5" cy="12" r="2" fill="#0a0e17" />
          <circle cx="19" cy="12" r="2" fill="#0a0e17" />
          <circle cx="12" cy="19" r="2.5" fill="#0a0e17" />
          {/* Center point */}
          <circle cx="12" cy="12" r="1.5" fill="#0a0e17" />
          {/* Connection lines */}
          <path
            d="M12 5L5 12M12 5L19 12M5 12L12 19M19 12L12 19M12 5L12 12M5 12L12 12M19 12L12 12M12 19L12 12"
            stroke="#0a0e17"
            strokeWidth="1.2"
            strokeOpacity="0.5"
          />
        </svg>
      </div>
    ),
    {
      ...size
    }
  );
}
