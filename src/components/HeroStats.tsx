"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import useGeolocation from "@/hooks/useGeolocation";

type PlannerSummary = {
  overallQuality: { score: number; rating: string };
  visiblePlanets: { name: string }[];
  optimalWindow: { start: string; end: string };
  localDarkSkyScore: number;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function HeroStats() {
  const [data, setData] = useState<PlannerSummary | null>(null);
  const [error, setError] = useState(false);
  const geo = useGeolocation();

  useEffect(() => {
    const params = new URLSearchParams();
    if (geo.status === "ready" && geo.lat !== null && geo.lng !== null) {
      params.set("lat", geo.lat.toFixed(4));
      params.set("lng", geo.lng.toFixed(4));
    }

    fetch(`/api/planner/tonight?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json() as Promise<PlannerSummary>;
      })
      .then(setData)
      .catch(() => setError(true));
  }, [geo.status, geo.lat, geo.lng]);

  if (error) {
    return (
      <div className="glass rounded-2xl p-5 text-sm text-starlight/50">
        Unable to load tonight&apos;s summary. Check back later.
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass animate-pulse rounded-2xl p-5">
            <div className="h-3 w-16 rounded bg-white/10" />
            <div className="mt-3 h-6 w-24 rounded bg-white/10" />
            <div className="mt-2 h-3 w-32 rounded bg-white/5" />
          </div>
        ))}
      </div>
    );
  }

  const targetCount = data.visiblePlanets.length;
  const windowStart = formatTime(data.optimalWindow.start);
  const windowEnd = formatTime(data.optimalWindow.end);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        label="Tonight"
        value={`${targetCount} target${targetCount !== 1 ? "s" : ""}`}
        detail={data.overallQuality.rating}
      />
      <StatCard
        label="Dark sky"
        value={`${data.localDarkSkyScore} / 100`}
        detail={`Window ${windowStart}–${windowEnd}`}
      />
      <StatCard
        label="Quality"
        value={`${data.overallQuality.score}/100`}
        detail="Overall observation score"
      />
    </div>
  );
}
