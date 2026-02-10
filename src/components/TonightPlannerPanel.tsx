"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useGeolocation from "@/hooks/useGeolocation";
import LoadingSpinner from "@/components/LoadingSpinner";

type PlannerResponse = {
  overallQuality: {
    score: number;
    rating: string;
    description: string;
  };
  optimalWindow: {
    start: string;
    end: string;
    duration: number;
    quality: number;
  };
  weather: {
    cloudCover: number;
    seeing: string;
    quality: number;
    source: string;
  } | null;
  generatedAt?: string;
  localDarkSkyScore: number;
  visiblePlanets: { name: string; bestAltitude: number; bestTime: string }[];
  recommendations: { priority: string; title: string; description: string; timing: string }[];
};

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function TonightPlannerPanel() {
  const geo = useGeolocation();
  const [status, setStatus] = useState<"idle" | "loading" | "refreshing" | "error">("idle");
  const [data, setData] = useState<PlannerResponse | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (geo.status === "ready" && geo.lat !== null && geo.lng !== null) {
      params.set("lat", geo.lat.toFixed(4));
      params.set("lng", geo.lng.toFixed(4));
    }
    return params.toString();
  }, [geo.status, geo.lat, geo.lng]);

  const loadPlan = useCallback((mode: "initial" | "refresh" = "initial") => {
    setStatus(mode === "refresh" && data ? "refreshing" : "loading");
    fetch(`/api/planner/tonight${query ? `?${query}` : ""}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Planner request failed: ${res.status}`);
        }
        return res.json() as Promise<PlannerResponse>;
      })
      .then((payload) => {
        setData(payload);
        setStatus("idle");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [query, data]);

  useEffect(() => {
    loadPlan("initial");
  }, [loadPlan]);

  if (status === "loading" && !data) {
    return (
      <div className="glass rounded-3xl p-6">
        <LoadingSpinner message="Building your tonight plan..." />
      </div>
    );
  }

  if (status === "error" || !data) {
    return (
      <div className="glass rounded-3xl p-6">
        <div className="text-sm text-ember">Unable to generate live plan right now.</div>
        <button onClick={() => loadPlan("initial")} className="button-ghost mt-4">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Tonight Run-Now</div>
          <h3 className="mt-2 text-2xl font-semibold text-starlight">{data.overallQuality.rating}</h3>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold text-aurora">{data.overallQuality.score}</div>
          <div className="text-xs text-starlight/50">Overall score</div>
        </div>
      </div>

      <p className="mt-3 text-sm text-starlight/70">{data.overallQuality.description}</p>
      {geo.status === "error" ? (
        <p className="mt-2 text-xs text-ember">
          Using default coordinates because browser location is unavailable.
        </p>
      ) : null}
      {status === "refreshing" ? (
        <p className="mt-2 text-xs text-aurora">Refreshing live conditions...</p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-starlight/50">Optimal window</div>
          <div className="mt-2 text-sm text-starlight/90">
            {formatTime(data.optimalWindow.start)} to {formatTime(data.optimalWindow.end)}
          </div>
          <div className="mt-1 text-xs text-starlight/60">{data.optimalWindow.duration}h duration</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-starlight/50">Local dark-sky score</div>
          <div className="mt-2 text-sm text-starlight/90">{data.localDarkSkyScore}</div>
          <div className="mt-1 text-xs text-starlight/60">
            Weather quality {data.weather?.quality ?? "n/a"}
          </div>
          {data.weather ? (
            <div className="mt-1 text-[11px] text-starlight/50">Source: {data.weather.source}</div>
          ) : null}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Top targets</div>
        <div className="mt-2 space-y-2 text-sm text-starlight/80">
          {data.visiblePlanets.slice(0, 3).map((planet) => (
            <div key={planet.name} className="flex items-center justify-between rounded-xl border border-white/10 p-3">
              <div>
                <div>{planet.name}</div>
                <div className="text-[11px] text-starlight/50">{planet.bestTime}</div>
              </div>
              <span className="text-xs text-starlight/60">{planet.bestAltitude} deg</span>
            </div>
          ))}
          {data.visiblePlanets.length === 0 ? <div className="text-xs text-starlight/50">No bright planets in prime position.</div> : null}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Recommendations</div>
        <div className="mt-2 space-y-2 text-sm text-starlight/80">
          {data.recommendations.slice(0, 3).map((recommendation, index) => (
            <div key={`${recommendation.title}-${index}`} className="rounded-xl border border-white/10 p-3">
              <div className="font-semibold text-starlight">{recommendation.title}</div>
              <div className="mt-1 text-xs text-starlight/60">{recommendation.description}</div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => loadPlan("refresh")}
        disabled={status === "loading" || status === "refreshing"}
        className="button-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "refreshing" ? "Refreshing..." : "Refresh live plan"}
      </button>
      {data.generatedAt ? (
        <p className="mt-3 text-center text-[11px] text-starlight/50">
          Updated {new Date(data.generatedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
        </p>
      ) : null}
    </div>
  );
}
