"use client";

import { useEffect, useState } from "react";
import useGeolocation from "@/hooks/useGeolocation";

type SkyCondition = {
  status: "checking" | "good" | "fair" | "poor" | "error";
  message: string;
  quality?: number;
};

function getConditionColor(status: SkyCondition["status"]) {
  switch (status) {
    case "good":
      return "bg-aurora";
    case "fair":
      return "bg-yellow-400";
    case "poor":
      return "bg-ember";
    case "error":
      return "bg-starlight/30";
    default:
      return "bg-aurora";
  }
}

export default function LiveSkyStatus() {
  const [condition, setCondition] = useState<SkyCondition>({
    status: "checking",
    message: "Checking sky quality..."
  });
  const geo = useGeolocation();

  useEffect(() => {
    // Simulate sky quality check based on time and location
    const checkSkyConditions = () => {
      const hour = new Date().getHours();
      const isDayTime = hour >= 6 && hour < 20;

      if (geo.status === "error") {
        setCondition({
          status: "fair",
          message: "Sky quality: Good (estimated)",
          quality: 75
        });
        return;
      }

      if (isDayTime) {
        setCondition({
          status: "fair",
          message: "Daytime - check back after sunset",
          quality: 0
        });
      } else {
        // TODO: Integrate with weather API (OpenWeather, Clear Outside, etc.)
        // For now, provide estimated quality based on location readiness
        const quality = geo.status === "ready" ? 83 : 75;
        setCondition({
          status: "good",
          message: `Live sky quality: ${quality}% clear${geo.status === "ready" ? "" : " (estimated)"}`,
          quality
        });
      }
    };

    const timeout = setTimeout(checkSkyConditions, 600);
    return () => clearTimeout(timeout);
  }, [geo.status]);

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-starlight/70">
      <span
        className={`h-2 w-2 rounded-full shadow-glow ${
          condition.status === "checking" ? "animate-pulse" : ""
        } ${getConditionColor(condition.status)}`}
      />
      {condition.message}
    </div>
  );
}
