"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import useGeolocation from "@/hooks/useGeolocation";

const StarMap = dynamic(() => import("@/components/StarMap"), {
  ssr: false,
  loading: () => <p className="mono" style={{ padding: 16 }}>Loading map...</p>
});

/** Nine Bortle classes, darkest (1) to brightest (9), #05070F to #D9D2C0. */
export const BORTLE_SWATCHES = [
  "#05070F",
  "#202025",
  "#3A3A3B",
  "#545351",
  "#6F6C68",
  "#8A867E",
  "#A49F94",
  "#BEB9AA",
  "#D9D2C0"
] as const;

type DarkSkyStats = {
  userDarkSkyScore?: number;
  conditions?: { moonIllumination?: number; cloudCover?: number | null };
};

/** Same estimate the page used before: score 0..100 maps onto Bortle 9..1. */
export function bortleFromScore(score: number): number {
  return Math.max(1, Math.min(9, Math.round(9 - score / 12)));
}

export default function DarkSky() {
  const geo = useGeolocation();
  const [stats, setStats] = useState<DarkSkyStats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (geo.status === "ready" && geo.lat !== null && geo.lng !== null) {
      params.set("lat", geo.lat.toFixed(4));
      params.set("lng", geo.lng.toFixed(4));
    }
    params.set("limit", "1");
    let live = true;
    fetch(`/api/locations?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json() as Promise<DarkSkyStats>;
      })
      .then((d) => {
        if (live) setStats(d);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [geo.status, geo.lat, geo.lng]);

  const score = stats?.userDarkSkyScore ?? null;
  const bortle = score === null ? null : bortleFromScore(score);
  const clouds = stats?.conditions?.cloudCover ?? null;
  const moon = stats?.conditions?.moonIllumination ?? null;

  return (
    <div className="two-col">
      <div className="log-page">
        <p className="mono">Bortle scale, 1 darkest to 9 brightest</p>
        <ol className="bortle" style={{ listStyle: "none" }} aria-label="Bortle scale swatches">
          {BORTLE_SWATCHES.map((hex, i) => (
            <li
              key={hex}
              style={{ background: hex, color: i < 5 ? "#EFE6CF" : "#0B1426" }}
              aria-current={bortle === i + 1 ? "true" : undefined}
            >
              {i + 1}
              {bortle === i + 1 && <span className="pencil-circle" style={{ background: i < 5 ? "#EFE6CF" : "#0B1426" }} />}
            </li>
          ))}
        </ol>
        <p className="mono" style={{ marginTop: 16 }}>
          {failed
            ? "Sky condition data unavailable right now."
            : stats
              ? `Your sky: ${bortle !== null ? `Bortle ${bortle} (estimate)` : "Bortle n/a"}. Clouds ${clouds !== null ? `${clouds}%` : "n/a"}. Moon ${moon !== null ? `${Math.round(moon)}% lit` : "n/a"}.`
              : "Reading your sky..."}
        </p>
        <p style={{ margin: "12px 0 0" }}>
          <Link href="/locations" className="btn-line">
            Find dark-sky sites
          </Link>
        </p>
      </div>

      <figure className="map-frame">
        <div className="map-body">
          <StarMap showLightPollution overlayOpacity={0.6} />
        </div>
        <figcaption className="mono">Light-pollution map. Source: NASA VIIRS tiles.</figcaption>
      </figure>
    </div>
  );
}
