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

export default function PlannerLocationSearch() {
  const geo = useGeolocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [locationName, setLocationName] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((term: string) => {
    if (term.length < 2) {
      setResults([]);
      return;
    }
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=5&language=en&format=json`)
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

  function handleSelect(result: GeocodingResult) {
    setManualLocation(result.latitude, result.longitude);
    const display = result.admin1
      ? `${result.name}, ${result.admin1}`
      : `${result.name}, ${result.country}`;
    setLocationName(display);
    setQuery("");
    setResults([]);
    setShowResults(false);
  }

  function handleUseMyLocation() {
    requestGeolocation();
    setLocationName(null); // Will show lat/lng from geo
  }

  const activeLabel =
    locationName ??
    (geo.status === "ready" && geo.lat !== null
      ? `${geo.lat.toFixed(2)}, ${geo.lng?.toFixed(2)}`
      : null);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-starlight/50">Location</div>
      {activeLabel ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-aurora">
            <svg className="h-3.5 w-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {activeLabel}
          </div>
          <button
            onClick={() => {
              setLocationName(null);
              setShowResults(true);
            }}
            className="text-[11px] text-starlight/40 hover:text-starlight transition"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <div className="mt-2 relative">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Search for a city..."
              className="w-full rounded-xl bg-white/5 border border-white/10 p-2.5 text-sm text-starlight placeholder:text-starlight/30 focus:outline-none focus:ring-1 focus:ring-aurora"
            />
            {showResults && query.length >= 2 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-white/10 bg-deep-space/95 backdrop-blur-xl shadow-lg overflow-hidden">
                {results.length > 0 ? results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
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
          <button
            onClick={handleUseMyLocation}
            disabled={geo.status === "loading"}
            className="mt-2 flex items-center gap-1.5 text-xs text-aurora/80 hover:text-aurora transition disabled:opacity-50"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {geo.status === "loading" ? "Locating..." : "Use my location"}
          </button>
        </>
      )}
    </div>
  );
}
