"use client";

import { useEffect, useState, useCallback } from "react";
import useGeolocation from "@/hooks/useGeolocation";

type SkyCondition = {
  status: "checking" | "good" | "fair" | "poor" | "error";
  message: string;
  quality?: number;
  seeing?: string;
  source?: string;
};

type SkyQualityResponse = {
  cloudCover: number;
  seeing: "excellent" | "good" | "fair" | "poor";
  transparency: number;
  humidity: number;
  temperature: number;
  windSpeed: number;
  quality: number;
  source: "openweather" | "openmeteo" | "estimated";
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

function qualityToStatus(quality: number): SkyCondition["status"] {
  if (quality >= 70) return "good";
  if (quality >= 40) return "fair";
  return "poor";
}

export default function LiveSkyStatus() {
  const [condition, setCondition] = useState<SkyCondition>({
    status: "checking",
    message: "Checking sky quality..."
  });
  const geo = useGeolocation();

  const fetchSkyQuality = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(`/api/weather/sky-quality?lat=${lat}&lng=${lng}`);
      if (!response.ok) throw new Error("API error");

      const data: SkyQualityResponse = await response.json();
      const hour = new Date().getHours();
      const isDayTime = hour >= 6 && hour < 20;

      if (isDayTime) {
        setCondition({
          status: "fair",
          message: "Daytime - check back after sunset",
          quality: data.quality,
          source: data.source
        });
      } else {
        const statusText = data.seeing === "excellent" ? "Excellent" :
                          data.seeing === "good" ? "Good" :
                          data.seeing === "fair" ? "Fair" : "Poor";
        setCondition({
          status: qualityToStatus(data.quality),
          message: `Sky: ${statusText} (${data.quality}% clear, ${100 - data.cloudCover}% visibility)`,
          quality: data.quality,
          seeing: data.seeing,
          source: data.source
        });
      }
    } catch {
      setCondition({
        status: "fair",
        message: "Sky quality: Good (estimated)",
        quality: 75
      });
    }
  }, []);

  useEffect(() => {
    const checkSkyConditions = () => {
      if (geo.status === "ready" && geo.lat !== null && geo.lng !== null) {
        fetchSkyQuality(geo.lat, geo.lng);
      } else if (geo.status === "error") {
        // Use default location (Las Vegas)
        fetchSkyQuality(36.1147, -115.1728);
      }
      // If still loading, wait
    };

    const timeout = setTimeout(checkSkyConditions, 600);
    return () => clearTimeout(timeout);
  }, [geo.status, geo.lat, geo.lng, fetchSkyQuality]);

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
