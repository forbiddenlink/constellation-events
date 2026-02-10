"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import useGeolocation from "@/hooks/useGeolocation";

const StarMap = dynamic(() => import("@/components/StarMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-64 place-items-center rounded-2xl border border-white/10 bg-white/5 text-sm text-starlight/60">
      Loading map...
    </div>
  )
});

export default function LocationsMapPanel() {
  const [showLightPollution, setShowLightPollution] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(0.7);
  const [stats, setStats] = useState<{
    userDarkSkyScore: number | null;
    moonIllumination: number | null;
    cloudCover: number | null;
    weatherQuality: number | null;
    weatherSource: string | null;
  }>({
    userDarkSkyScore: null,
    moonIllumination: null,
    cloudCover: null,
    weatherQuality: null,
    weatherSource: null
  });
  const geo = useGeolocation();

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (geo.status === "ready" && geo.lat !== null && geo.lng !== null) {
      params.set("lat", geo.lat.toFixed(4));
      params.set("lng", geo.lng.toFixed(4));
    }
    params.set("limit", "1");
    return params.toString();
  }, [geo.status, geo.lat, geo.lng]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/locations?${query}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load location stats: ${res.status}`);
        return res.json() as Promise<{
          userDarkSkyScore?: number;
          conditions?: {
            moonIllumination?: number;
            cloudCover?: number | null;
            weatherQuality?: number | null;
            weatherSource?: string | null;
          };
        }>;
      })
      .then((payload) => {
        setStats({
          userDarkSkyScore: payload.userDarkSkyScore ?? null,
          moonIllumination: payload.conditions?.moonIllumination ?? null,
          cloudCover: payload.conditions?.cloudCover ?? null,
          weatherQuality: payload.conditions?.weatherQuality ?? null,
          weatherSource: payload.conditions?.weatherSource ?? null
        });
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      });

    return () => {
      controller.abort();
    };
  }, [query]);

  const estimatedBortle =
    stats.userDarkSkyScore === null
      ? "n/a"
      : String(Math.max(1, Math.min(9, Math.round(9 - stats.userDarkSkyScore / 12))));

  return (
    <div className="glass min-h-[420px] rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Sky quality map</div>
          <p className="mt-2 text-sm text-starlight/60">
            Toggle layers to compare light pollution with local conditions.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            className={`rounded-full border px-3 py-1 ${
              showLightPollution ? "border-aurora text-aurora" : "border-white/20 text-starlight/60"
            }`}
            onClick={() => setShowLightPollution((prev) => !prev)}
          >
            Light pollution
          </button>
          <span className="rounded-full border border-white/20 px-3 py-1 text-starlight/60">Clouds</span>
          <span className="rounded-full border border-white/20 px-3 py-1 text-starlight/60">Moon</span>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-starlight/60">
          <span>Light pollution intensity</span>
          <span>{Math.round(overlayOpacity * 100)}%</span>
        </div>
        <input
          type="range"
          min={20}
          max={90}
          value={Math.round(overlayOpacity * 100)}
          onChange={(event) => setOverlayOpacity(Number(event.target.value) / 100)}
          className="h-2 w-full cursor-pointer accent-aurora"
        />
        <div className="mt-3 flex items-center justify-between text-[11px] text-starlight/50">
          <span>Darker is better</span>
          <span className="rounded-full border border-white/20 px-2 py-1">Bortle map overlay</span>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Bortle", value: estimatedBortle },
          { label: "Clouds", value: stats.cloudCover === null ? "n/a" : `${stats.cloudCover}%` },
          { label: "Moon", value: stats.moonIllumination === null ? "n/a" : `${Math.round(stats.moonIllumination)}%` }
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-starlight/50">{item.label}</div>
            <div className="mt-2 text-lg font-semibold text-aurora">{item.value}</div>
          </div>
        ))}
      </div>
      {stats.weatherQuality !== null ? (
        <div className="mt-3 text-xs text-starlight/60">
          Weather quality score {stats.weatherQuality}
          {stats.weatherSource ? ` via ${stats.weatherSource}` : ""}
        </div>
      ) : null}
      <div className="mt-6">
        <StarMap showLightPollution={showLightPollution} overlayOpacity={overlayOpacity} />
      </div>
      <p className="mt-4 text-sm text-starlight/60">
        Add `NEXT_PUBLIC_LIGHTPOLLUTION_TILES` to overlay a light pollution raster layer.
      </p>
    </div>
  );
}
