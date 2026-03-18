"use client";

import { useEffect, useState } from "react";
import useGeolocation from "@/hooks/useGeolocation";

type DarkSkyStats = {
  userDarkSkyScore?: number;
  conditions?: {
    moonIllumination?: number;
    cloudCover?: number | null;
  };
};

export default function DarkSkyPreview() {
  const [stats, setStats] = useState<DarkSkyStats | null>(null);
  const [error, setError] = useState(false);
  const geo = useGeolocation();

  useEffect(() => {
    const params = new URLSearchParams();
    if (geo.status === "ready" && geo.lat !== null && geo.lng !== null) {
      params.set("lat", geo.lat.toFixed(4));
      params.set("lng", geo.lng.toFixed(4));
    }
    params.set("limit", "1");

    fetch(`/api/locations?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json() as Promise<DarkSkyStats>;
      })
      .then(setStats)
      .catch(() => setError(true));
  }, [geo.status, geo.lat, geo.lng]);

  const darkSkyScore = stats?.userDarkSkyScore ?? null;
  const cloudCover = stats?.conditions?.cloudCover ?? null;
  const moonPct = stats?.conditions?.moonIllumination ?? null;

  const bortle = darkSkyScore === null
    ? "—"
    : String(Math.max(1, Math.min(9, Math.round(9 - darkSkyScore / 12))));

  if (error) {
    return (
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-starlight/40">
        Sky condition data unavailable right now.
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs text-starlight/50">Bortle <span className="text-starlight/30">(1–9)</span></div>
        <div className="mt-1 text-[10px] text-starlight/30">1 = darkest sky</div>
        <div className="mt-2 font-mono text-lg font-semibold text-aurora">
          {stats ? bortle : <span className="inline-block h-5 w-10 animate-pulse rounded bg-white/10" />}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs text-starlight/50">Clouds</div>
        <div className="mt-2 font-mono text-lg font-semibold text-starlight">
          {stats ? (cloudCover !== null ? `${cloudCover}%` : "n/a") : <span className="inline-block h-5 w-10 animate-pulse rounded bg-white/10" />}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs text-starlight/50">Moon</div>
        <div className="mt-2 font-mono text-lg font-semibold text-ember">
          {stats ? (moonPct !== null ? `${Math.round(moonPct)}%` : "n/a") : <span className="inline-block h-5 w-10 animate-pulse rounded bg-white/10" />}
        </div>
      </div>
    </div>
  );
}
