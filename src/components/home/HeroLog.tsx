"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useGeolocation, { requestGeolocation, setManualLocation } from "@/hooks/useGeolocation";

type GeocodingResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
};

type PlannerSummary = {
  overallQuality: { score: number; rating: string };
  visiblePlanets: { name: string }[];
  optimalWindow: { start: string; end: string };
  localDarkSkyScore: number;
};

type SkyQualityResponse = {
  cloudCover: number;
  seeing: "excellent" | "good" | "fair" | "poor";
  quality: number;
};

const LAS_VEGAS_LAT = 36.1147;
const LAS_VEGAS_LNG = -115.1728;

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function qualityState(quality: number): "good" | "fair" | "poor" {
  if (quality >= 70) return "good";
  if (quality >= 40) return "fair";
  return "poor";
}

/**
 * The first log page: a fill-in "Date, Place" line and the live conditions as
 * pencil figures in the margin. Replaces the old onboarding card, the three
 * stat tiles and the sky-status pill.
 */
export default function HeroLog() {
  const geo = useGeolocation();
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [summary, setSummary] = useState<PlannerSummary | null>(null);
  const [summaryFailed, setSummaryFailed] = useState(false);
  const [sky, setSky] = useState<{ state: "good" | "fair" | "poor" | "checking" | "error"; text: string }>({
    state: "checking",
    text: "Checking sky quality..."
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    setToday(new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }));
  }, []);

  const search = useCallback((term: string) => {
    if (term.length < 2) {
      setResults([]);
      return;
    }
    fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=5&language=en&format=json`
    )
      .then((res) => res.json() as Promise<{ results?: GeocodingResult[] }>)
      .then((data) => setResults(data.results ?? []))
      .catch(() => setResults([]));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  const status = mounted ? geo.status : "idle";
  const lat = geo.lat;
  const lng = geo.lng;

  // Conditions: planner summary
  useEffect(() => {
    const params = new URLSearchParams();
    if (geo.status === "ready" && lat !== null && lng !== null) {
      params.set("lat", lat.toFixed(4));
      params.set("lng", lng.toFixed(4));
    }
    let live = true;
    fetch(`/api/planner/tonight?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json() as Promise<PlannerSummary>;
      })
      .then((d) => {
        if (live) setSummary(d);
      })
      .catch(() => {
        if (live) setSummaryFailed(true);
      });
    return () => {
      live = false;
    };
  }, [geo.status, lat, lng]);

  // Conditions: sky quality line
  useEffect(() => {
    const target =
      geo.status === "ready" && lat !== null && lng !== null
        ? { lat, lng }
        : geo.status === "error"
          ? { lat: LAS_VEGAS_LAT, lng: LAS_VEGAS_LNG }
          : null;
    if (!target) return;
    let live = true;
    fetch(`/api/weather/sky-quality?lat=${target.lat}&lng=${target.lng}`)
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json() as Promise<SkyQualityResponse>;
      })
      .then((d) => {
        if (!live) return;
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 20) {
          setSky({ state: "fair", text: "Daytime. Check back after sunset." });
        } else {
          const seeing = d.seeing.charAt(0).toUpperCase() + d.seeing.slice(1);
          setSky({
            state: qualityState(d.quality),
            text: `Clarity ${seeing}: ${d.quality}% clear, ${100 - d.cloudCover}% visibility`
          });
        }
      })
      .catch(() => {
        if (live) setSky({ state: "error", text: "Sky quality unavailable right now." });
      });
    return () => {
      live = false;
    };
  }, [geo.status, lat, lng]);

  function choose(r: GeocodingResult) {
    setPlaceName(`${r.name}${r.admin1 ? `, ${r.admin1}` : ""}`);
    setManualLocation(r.latitude, r.longitude);
    setSearching(false);
    setQuery("");
    setResults([]);
  }

  function useDefault() {
    setPlaceName("Las Vegas, NV");
    setManualLocation(LAS_VEGAS_LAT, LAS_VEGAS_LNG);
  }

  const isDefault =
    status === "ready" && lat !== null && lng !== null && Math.abs(lat - LAS_VEGAS_LAT) < 0.001 && Math.abs(lng - LAS_VEGAS_LNG) < 0.001;
  const readyLabel =
    placeName ??
    (isDefault ? "Las Vegas, NV" : lat !== null && lng !== null ? `${lat.toFixed(2)}, ${lng.toFixed(2)}` : "");
  const showChoices = status === "idle" || status === "error" || searching;

  return (
    <div className="log-page hero-page">
      <div>
        <div className="field-row">
          <span className="field-label">Date</span>
          <span className="mono">{today ?? "Tonight"}</span>
        </div>
        <div className="field-row">
          <span className="field-label">Place</span>
          <div style={{ position: "relative" }}>
            {status === "loading" && <span className="mono">Finding you...</span>}
            {status === "ready" && !searching && (
              <div className="place-choices">
                <span className="mono pencil-underline">
                  {readyLabel}
                  {isDefault && !placeName ? " (default)" : ""}
                </span>
                <button type="button" className="link-ink" onClick={() => setSearching(true)}>
                  Change
                </button>
              </div>
            )}
            {showChoices && status !== "loading" && !searching && (
              <div className="place-choices">
                <button type="button" className="btn-lamp" onClick={requestGeolocation}>
                  Use my location
                </button>
                <button type="button" className="btn-line" onClick={() => setSearching(true)}>
                  Search a city
                </button>
                <button type="button" className="link-ink" onClick={useDefault}>
                  Las Vegas (default)
                </button>
              </div>
            )}
            {searching && (
              <div>
                <label className="eyebrow" htmlFor="city-search" style={{ color: "inherit", display: "block" }}>
                  City
                </label>
                <input
                  id="city-search"
                  className="city-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type a city"
                  autoComplete="off"
                />
                {query.length >= 2 && (
                  <div className="city-results" role="listbox" aria-label="City results">
                    {results.length > 0 ? (
                      results.map((r) => (
                        <button key={r.id} type="button" onClick={() => choose(r)}>
                          {r.name}
                          {r.admin1 ? `, ${r.admin1}` : ""} <span className="mono">{r.country}</span>
                        </button>
                      ))
                    ) : (
                      <div className="mono" style={{ padding: "8px 12px" }}>
                        No cities found
                      </div>
                    )}
                  </div>
                )}
                <div className="place-choices" style={{ marginTop: 8 }}>
                  <button type="button" className="link-ink" onClick={() => { setSearching(false); setQuery(""); setResults([]); }}>
                    Back
                  </button>
                  <button type="button" className="link-ink" onClick={() => { setSearching(false); requestGeolocation(); }}>
                    Use my location instead
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="field-row">
          <span className="field-label">Sky</span>
          <p className="pencil-status mono" style={{ margin: 0 }}>
            <span className="dot" data-state={sky.state} aria-hidden="true" />
            <span>
              {status === "idle" && sky.state === "checking" ? "Choose a place to read the sky." : sky.text}
            </span>
          </p>
        </div>
        {summary && (
          <div className="field-row">
            <span className="field-label">Best</span>
            <span className="mono">
              {formatTime(summary.optimalWindow.start)} to {formatTime(summary.optimalWindow.end)}
            </span>
          </div>
        )}
      </div>

      <ul className="figures" aria-label="Tonight's figures">
        {summary ? (
          <>
            <li className="figure">
              <span className="figure-n">{summary.visiblePlanets.length}</span>
              <span className="figure-l">planets up tonight</span>
            </li>
            <li className="figure">
              <span className="figure-n">{summary.localDarkSkyScore}</span>
              <span className="figure-l">dark-sky score</span>
            </li>
            <li className="figure">
              <span className="figure-n">{summary.overallQuality.score}</span>
              <span className="figure-l">night quality, of 100</span>
            </li>
          </>
        ) : (
          <li className="figure">
            <span className="figure-l">{summaryFailed ? "Figures unavailable." : "Reading the figures..."}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
