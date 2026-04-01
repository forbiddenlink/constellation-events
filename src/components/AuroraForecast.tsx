"use client";

import { useEffect, useState, useCallback } from "react";
import useGeolocation from "@/hooks/useGeolocation";

type KpForecast = {
  time: string;
  kp: number;
  observed: boolean;
};

type AuroraData = {
  current: {
    kp: number;
    stormLevel: "none" | "minor" | "moderate" | "strong" | "severe" | "extreme";
    description: string;
  };
  forecast: KpForecast[];
  visibility: {
    probability: "none" | "unlikely" | "possible" | "likely" | "high";
    minimumLatitude: number;
    message: string;
  };
  source: "noaa" | "estimated";
  location: { lat: number };
  timestamp: string;
};

function getKpColor(kp: number): string {
  if (kp >= 7) return "text-ember";
  if (kp >= 5) return "text-caution";
  if (kp >= 3) return "text-aurora";
  return "text-starlight/70";
}

function getKpBarColor(kp: number): string {
  if (kp >= 7) return "bg-ember";
  if (kp >= 5) return "bg-caution";
  if (kp >= 3) return "bg-aurora";
  return "bg-starlight/30";
}

function getProbabilityColor(probability: AuroraData["visibility"]["probability"]): string {
  switch (probability) {
    case "high":
      return "text-aurora";
    case "likely":
      return "text-aurora/80";
    case "possible":
      return "text-caution";
    case "unlikely":
      return "text-starlight/60";
    case "none":
      return "text-starlight/40";
  }
}

function getProbabilityBadgeColor(probability: AuroraData["visibility"]["probability"]): string {
  switch (probability) {
    case "high":
      return "bg-aurora/20 border-aurora/40 text-aurora";
    case "likely":
      return "bg-aurora/15 border-aurora/30 text-aurora/90";
    case "possible":
      return "bg-caution/20 border-caution/40 text-caution";
    case "unlikely":
      return "bg-white/5 border-white/20 text-starlight/60";
    case "none":
      return "bg-white/5 border-white/10 text-starlight/40";
  }
}

function getStormLevelColor(level: AuroraData["current"]["stormLevel"]): string {
  switch (level) {
    case "extreme":
    case "severe":
      return "text-ember";
    case "strong":
    case "moderate":
      return "text-caution";
    case "minor":
      return "text-aurora";
    case "none":
      return "text-starlight/50";
  }
}

function formatForecastTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString.slice(11, 16);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function AuroraForecast() {
  const [data, setData] = useState<AuroraData | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [showForecast, setShowForecast] = useState(false);
  const geo = useGeolocation();

  const fetchAuroraData = useCallback(async (lat: number) => {
    try {
      setStatus("loading");
      const response = await fetch(`/api/aurora?lat=${lat}`);
      if (!response.ok) throw new Error("Failed to fetch aurora data");
      const result: AuroraData = await response.json();
      setData(result);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (geo.status === "ready" && geo.lat !== null) {
      fetchAuroraData(geo.lat);
    } else if (geo.status === "error") {
      // Use default location (Las Vegas - 36.1147)
      fetchAuroraData(36.1147);
    }
  }, [geo.status, geo.lat, fetchAuroraData]);

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Aurora Forecast</div>
          <h3 className="mt-1 text-lg font-semibold text-starlight">Northern Lights Activity</h3>
        </div>
        {data?.source === "noaa" && (
          <span className="rounded-full bg-aurora/20 px-2 py-0.5 text-[10px] text-aurora">
            NOAA SWPC
          </span>
        )}
      </div>

      {status === "loading" && !data && (
        <div className="mt-4 text-sm text-starlight/60">Checking geomagnetic activity...</div>
      )}

      {status === "error" && (
        <div className="mt-4 text-sm text-ember">Unable to fetch aurora forecast.</div>
      )}

      {data && (
        <div className="mt-4 space-y-4">
          {/* Current Kp Index */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="text-[10px] uppercase tracking-wider text-starlight/40">Kp Index</div>
              <div className={`text-4xl font-bold ${getKpColor(data.current.kp)}`}>
                {data.current.kp.toFixed(1)}
              </div>
            </div>
            <div className="flex-1">
              {/* Kp Scale Bar */}
              <div className="flex h-3 gap-0.5 rounded-full overflow-hidden">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                  <div
                    key={level}
                    className={`flex-1 transition-all ${
                      level <= Math.ceil(data.current.kp)
                        ? getKpBarColor(level)
                        : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[9px] text-starlight/30">
                <span>Quiet</span>
                <span>Minor Storm</span>
                <span>Severe</span>
              </div>
            </div>
          </div>

          {/* Storm Level */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <span className={`text-sm font-medium ${getStormLevelColor(data.current.stormLevel)}`}>
                  {data.current.stormLevel === "none" ? "No Storm" : `${data.current.stormLevel.charAt(0).toUpperCase() + data.current.stormLevel.slice(1)} Storm`}
                </span>
                <p className="mt-1 text-xs text-starlight/60">{data.current.description}</p>
              </div>
            </div>
          </div>

          {/* Visibility for User Location */}
          <div className="rounded-xl border border-aurora/20 bg-aurora/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-starlight/40">
                  Visibility at Your Location
                </div>
                <div className={`mt-1 text-lg font-semibold ${getProbabilityColor(data.visibility.probability)}`}>
                  {data.visibility.probability.charAt(0).toUpperCase() + data.visibility.probability.slice(1)}
                </div>
              </div>
              <div className={`rounded-full border px-3 py-1 text-xs ${getProbabilityBadgeColor(data.visibility.probability)}`}>
                {data.visibility.minimumLatitude}° min latitude
              </div>
            </div>
            <p className="mt-2 text-xs text-starlight/60">{data.visibility.message}</p>
          </div>

          {/* 3-Hour Forecast Toggle */}
          {data.forecast.length > 0 && (
            <div>
              <button
                onClick={() => setShowForecast(!showForecast)}
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-starlight/70 transition-colors hover:border-white/20"
              >
                <span>3-Day Kp Forecast</span>
                <span className="text-starlight/40">{showForecast ? "Hide" : "Show"}</span>
              </button>

              {showForecast && (
                <div className="mt-3 space-y-1">
                  {data.forecast.slice(0, 8).map((period, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2"
                    >
                      <span className="text-xs text-starlight/60">
                        {formatForecastTime(period.time)}
                        {period.observed && (
                          <span className="ml-1 text-[9px] text-aurora/70">(observed)</span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full transition-all ${getKpBarColor(period.kp)}`}
                            style={{ width: `${(period.kp / 9) * 100}%` }}
                          />
                        </div>
                        <span className={`w-8 text-right text-xs font-mono ${getKpColor(period.kp)}`}>
                          {period.kp.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Aurora Viewing Tips */}
          {data.current.kp >= 4 && (
            <div className="rounded-lg border border-aurora/30 bg-aurora/10 p-3">
              <div className="text-xs font-medium text-aurora">Aurora Alert</div>
              <p className="mt-1 text-xs text-starlight/70">
                Elevated geomagnetic activity detected. If you're at a high latitude with clear skies,
                look north after dark for potential aurora displays.
              </p>
            </div>
          )}
        </div>
      )}

      {data?.timestamp && (
        <div className="mt-4 text-[10px] text-starlight/30">
          Data from {data.source.toUpperCase()} • Updated {new Date(data.timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
