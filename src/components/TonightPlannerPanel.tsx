"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useGeolocation from "@/hooks/useGeolocation";
import LoadingSpinner from "@/components/LoadingSpinner";
import LocalTime from "@/components/LocalTime";

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

const formatTime = (date: Date) => date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

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
    setStatus((prev) => mode === "refresh" && prev !== "loading" ? "refreshing" : "loading");
    fetch(`/api/planner/tonight${query ? `?${query}` : ""}`, { cache: "no-store" })
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
  }, [query]);

  useEffect(() => {
    loadPlan("initial");
  }, [loadPlan]);

  if (status === "loading" && !data) {
    return (
      <div className="plan-body">
        <LoadingSpinner message="Building your tonight plan..." />
      </div>
    );
  }

  if (status === "error" || !data) {
    return (
      <div className="plan-body">
        <p className="plan-alert">Unable to generate live plan right now.</p>
        <button onClick={() => loadPlan("initial")} className="btn-line">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="plan-body">
      <div className="plan-verdict">
        <div>
          <p className="plan-label">Tonight&apos;s observation plan</p>
          <h2 className="plan-rating">{data.overallQuality.rating}</h2>
        </div>
        <div className="plan-score">
          <div className="plan-score-n">{data.overallQuality.score}</div>
          <div>Overall score</div>
          <div>out of 100</div>
        </div>
      </div>

      <p className="plan-desc">{data.overallQuality.description}</p>
      {geo.status === "error" ? (
        <p className="plan-alert">Using default coordinates because browser location is unavailable.</p>
      ) : null}
      {status === "refreshing" ? <p className="plan-alert">Refreshing live conditions...</p> : null}

      <dl className="plan-ledger">
        <div className="plan-row">
          <dt>Optimal window</dt>
          <dd>
            <span>
              <LocalTime iso={data.optimalWindow.start} format={formatTime} /> to{" "}
              <LocalTime iso={data.optimalWindow.end} format={formatTime} />
            </span>
            <span className="plan-sub">{data.optimalWindow.duration}h duration</span>
          </dd>
        </div>
        <div className="plan-row">
          <dt>Local dark-sky score</dt>
          <dd>
            <span>{data.localDarkSkyScore}</span>
            <span className="plan-sub">out of 100 · higher is better</span>
          </dd>
        </div>
        <div className="plan-row">
          <dt>Weather</dt>
          <dd>
            <span>Weather quality {data.weather?.quality ?? "n/a"}</span>
            {data.weather ? <span className="plan-sub">Source: {data.weather.source}</span> : null}
          </dd>
        </div>
      </dl>

      <h3 className="plan-h">Top targets</h3>
      <ol className="plan-list">
        {data.visiblePlanets.slice(0, 3).map((planet, i) => (
          <li key={planet.name} className="plan-entry">
            <span className="plan-n" aria-hidden="true">{i + 1}</span>
            <div>
              <div className="plan-entry-name">{planet.name}</div>
              <div className="plan-sub">
                <LocalTime iso={planet.bestTime} format={formatTime} />
              </div>
            </div>
            <div className="plan-alt">
              <span title="Altitude above the horizon at the best viewing time">{planet.bestAltitude}&deg; alt</span>
              <span className="plan-bar" aria-hidden="true">
                <i style={{ width: `${Math.max(0, Math.min(100, (planet.bestAltitude / 90) * 100))}%` }} />
              </span>
            </div>
          </li>
        ))}
      </ol>
      {data.visiblePlanets.length === 0 ? <p className="plan-sub">No bright planets in prime position.</p> : null}

      <h3 className="plan-h">Recommendations</h3>
      <ol className="plan-list">
        {data.recommendations.slice(0, 3).map((recommendation, index) => (
          <li key={`${recommendation.title}-${index}`} className="plan-entry plan-note">
            <span className="plan-n" aria-hidden="true">{index + 1}</span>
            <div>
              <div className="plan-entry-name">{recommendation.title}</div>
              <div className="plan-sub">{recommendation.description}</div>
            </div>
          </li>
        ))}
      </ol>

      <div className="plan-foot">
        <button
          onClick={() => loadPlan("refresh")}
          disabled={status === "loading" || status === "refreshing"}
          className="btn-lamp disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "refreshing" ? "Refreshing..." : "Refresh live plan"}
        </button>
        {data.generatedAt ? (
          <p className="plan-sub">
            Updated <LocalTime iso={data.generatedAt} format={formatTime} />
          </p>
        ) : null}
      </div>
    </div>
  );
}
