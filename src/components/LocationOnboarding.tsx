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

type GeocodingResponse = {
  results?: GeocodingResult[];
};

const LAS_VEGAS_LAT = 36.1147;
const LAS_VEGAS_LNG = -115.1728;

export default function LocationOnboarding() {
  const geo = useGeolocation();
  const [mode, setMode] = useState<"prompt" | "search">("prompt");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((term: string) => {
    if (term.length < 2) {
      setResults([]);
      return;
    }
    fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=5&language=en&format=json`
    )
      .then((res) => res.json() as Promise<GeocodingResponse>)
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

  // Don't render if location already set or being resolved
  if (geo.status !== "idle") return null;

  function handleSelectCity(result: GeocodingResult) {
    setManualLocation(result.latitude, result.longitude);
  }

  function handleUseDefault() {
    setManualLocation(LAS_VEGAS_LAT, LAS_VEGAS_LNG);
  }

  return (
    <div className="glass rounded-2xl p-5 sm:p-6 mb-10 border border-aurora/20">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-aurora/10">
          <svg className="h-5 w-5 text-aurora" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-starlight">Where are you observing from?</h2>
          <p className="mt-1 text-xs text-starlight/60">
            Sky conditions, visible objects, and event times are calculated for your location.
          </p>

          {mode === "prompt" ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={requestGeolocation} className="button-primary !py-2 !px-4 !text-xs">
                Use my location
              </button>
              <button onClick={() => setMode("search")} className="button-ghost !py-2 !px-4 !text-xs">
                Search a city
              </button>
              <button
                onClick={handleUseDefault}
                className="text-xs text-starlight/40 hover:text-starlight/60 transition py-2"
              >
                Continue with default (Las Vegas)
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  placeholder="Search for a city..."
                  className="w-full rounded-xl bg-white/5 border border-white/10 p-2.5 text-sm text-starlight placeholder:text-starlight/30 focus:outline-none focus:ring-1 focus:ring-aurora"
                />
                {query.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-white/10 bg-deep-space/95 backdrop-blur-xl shadow-lg overflow-hidden">
                    {results.length > 0 ? results.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelectCity(result)}
                        className="w-full text-left px-4 py-2.5 text-sm text-starlight/80 hover:bg-white/10 transition-colors"
                        type="button"
                      >
                        {result.name}
                        {result.admin1 ? `, ${result.admin1}` : ""}
                        <span className="ml-1 text-xs text-starlight/40">{result.country}</span>
                      </button>
                    )) : (
                      <div className="px-4 py-3 text-sm text-starlight/40">No cities found</div>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={() => { setMode("prompt"); setQuery(""); setResults([]); }}
                  className="text-xs text-starlight/40 hover:text-starlight/60 transition"
                >
                  ← Back
                </button>
                <button
                  onClick={requestGeolocation}
                  className="text-xs text-aurora/80 hover:text-aurora transition"
                >
                  Use my location instead
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
