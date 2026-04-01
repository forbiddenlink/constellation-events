"use client";

import { useEffect, useState, useCallback } from "react";
import useGeolocation from "@/hooks/useGeolocation";

type ISSPosition = {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  timestamp: string;
  footprint?: number;
};

type ISSPass = {
  risetime: string;
  duration: number;
  riseAzimuth: number;
  maxAltitude: number;
  setAzimuth: number;
  brightness: "visible" | "possibly-visible" | "not-visible";
  formatted: {
    time: string;
    riseDirection: string;
    setDirection: string;
    maxAltitude: string;
  };
};

type ISSData = {
  position: ISSPosition | null;
  passes: ISSPass[];
  groundTrack?: Array<{ lat: number; lng: number; time: string }>;
  source: "satellite.js" | "api" | "estimated";
  generatedAt: string;
};

function formatVelocity(kmh: number): string {
  return `${Math.round(kmh).toLocaleString()} km/h`;
}

function formatAltitude(km: number): string {
  return `${Math.round(km)} km`;
}

function getBrightnessColor(brightness: ISSPass["brightness"]): string {
  switch (brightness) {
    case "visible":
      return "text-aurora";
    case "possibly-visible":
      return "text-caution";
    case "not-visible":
      return "text-starlight/50";
  }
}

function getBrightnessLabel(brightness: ISSPass["brightness"]): string {
  switch (brightness) {
    case "visible":
      return "Bright";
    case "possibly-visible":
      return "Visible";
    case "not-visible":
      return "Dim";
  }
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffMs < 0) return "Now";
  if (diffHours < 1) return `in ${diffMinutes}m`;
  if (diffHours < 24) return `in ${diffHours}h ${diffMinutes}m`;
  return date.toLocaleDateString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
}

export default function ISSTracker() {
  const [data, setData] = useState<ISSData | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [expanded, setExpanded] = useState(false);
  const geo = useGeolocation();

  const fetchISSData = useCallback(async (lat: number, lng: number) => {
    try {
      setStatus("loading");
      const response = await fetch(`/api/iss?lat=${lat}&lng=${lng}&count=5`);
      if (!response.ok) throw new Error("Failed to fetch ISS data");
      const result: ISSData = await response.json();
      setData(result);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (geo.status === "ready" && geo.lat !== null && geo.lng !== null) {
      fetchISSData(geo.lat, geo.lng);
    } else if (geo.status === "error") {
      // Use default location (Las Vegas)
      fetchISSData(36.1147, -115.1728);
    }
  }, [geo.status, geo.lat, geo.lng, fetchISSData]);

  // Refresh position every 30 seconds
  useEffect(() => {
    if (!data?.position) return;

    const interval = setInterval(() => {
      if (geo.lat !== null && geo.lng !== null) {
        fetchISSData(geo.lat, geo.lng);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [data?.position, geo.lat, geo.lng, fetchISSData]);

  const nextPass = data?.passes[0];

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">ISS Tracker</div>
          <h3 className="mt-1 text-lg font-semibold text-starlight">International Space Station</h3>
        </div>
        <div className="flex items-center gap-2">
          {data?.source === "satellite.js" && (
            <span className="rounded-full bg-aurora/20 px-2 py-0.5 text-[10px] text-aurora">
              TLE tracking
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-full border border-white/20 px-3 py-1 text-xs text-starlight/70 transition-colors hover:border-white/40"
          >
            {expanded ? "Less" : "More"}
          </button>
        </div>
      </div>

      {status === "loading" && !data && (
        <div className="mt-4 text-sm text-starlight/60">Tracking ISS position...</div>
      )}

      {status === "error" && (
        <div className="mt-4 text-sm text-ember">Unable to track ISS. Please try again later.</div>
      )}

      {data?.position && (
        <div className="mt-4 space-y-4">
          {/* Current Position */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-[10px] uppercase tracking-wider text-starlight/40">Latitude</div>
              <div className="mt-1 font-mono text-sm text-starlight">
                {data.position.latitude.toFixed(2)}°
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-[10px] uppercase tracking-wider text-starlight/40">Longitude</div>
              <div className="mt-1 font-mono text-sm text-starlight">
                {data.position.longitude.toFixed(2)}°
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-[10px] uppercase tracking-wider text-starlight/40">Altitude</div>
              <div className="mt-1 font-mono text-sm text-starlight">
                {formatAltitude(data.position.altitude)}
              </div>
            </div>
          </div>

          {/* Velocity */}
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-starlight/40">Velocity</div>
              <div className="mt-1 font-mono text-lg font-semibold text-aurora">
                {formatVelocity(data.position.velocity)}
              </div>
            </div>
            {data.position.footprint && (
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-starlight/40">Footprint</div>
                <div className="mt-1 font-mono text-sm text-starlight/70">
                  {Math.round(data.position.footprint)} km radius
                </div>
              </div>
            )}
          </div>

          {/* Next Pass Preview */}
          {nextPass && (
            <div className="rounded-xl border border-aurora/30 bg-aurora/10 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-aurora/70">Next Visible Pass</div>
                  <div className="mt-1 text-lg font-semibold text-starlight">
                    {formatRelativeTime(nextPass.risetime)}
                  </div>
                  <div className="mt-1 text-xs text-starlight/60">
                    {nextPass.formatted.riseDirection} → {nextPass.formatted.setDirection} • Max {nextPass.formatted.maxAltitude}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium ${getBrightnessColor(nextPass.brightness)}`}>
                    {getBrightnessLabel(nextPass.brightness)}
                  </span>
                  <div className="mt-1 text-xs text-starlight/50">
                    {Math.round(nextPass.duration / 60)} min
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expanded Pass List */}
          {expanded && data.passes.length > 1 && (
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-starlight/40">Upcoming Passes</div>
              {data.passes.slice(1).map((pass, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                >
                  <div>
                    <div className="text-sm text-starlight">{pass.formatted.time}</div>
                    <div className="text-xs text-starlight/50">
                      {pass.formatted.riseDirection} → {pass.formatted.setDirection}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs ${getBrightnessColor(pass.brightness)}`}>
                      {getBrightnessLabel(pass.brightness)}
                    </span>
                    <div className="text-[10px] text-starlight/40">
                      {pass.formatted.maxAltitude} max
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ground Track Info */}
          {expanded && data.groundTrack && data.groundTrack.length > 0 && (
            <div className="text-xs text-starlight/40">
              Ground track: {data.groundTrack.length} points over next 90 minutes
            </div>
          )}
        </div>
      )}

      {data?.generatedAt && (
        <div className="mt-4 text-[10px] text-starlight/30">
          Updated {new Date(data.generatedAt).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
