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
    <div className="plan-place">
      {activeLabel ? (
        <div className="plan-place-row">
          <div className="plan-place-label">
            <svg className="plan-pin" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {activeLabel}
          </div>
          <button
            onClick={() => {
              setLocationName(null);
              setShowResults(true);
            }}
            className="link-ink"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <div className="plan-search">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Search for a city..."
              aria-label="Search for a city" className="city-input"
            />
            {showResults && query.length >= 2 && (
              <div className="plan-results">
                {results.length > 0 ? results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className="plan-result"
                    type="button"
                  >
                    {result.name}
                    {result.admin1 ? `, ${result.admin1}` : ""}
                    <span className="plan-sub"> {result.country}</span>
                  </button>
                )) : (
                  <div className="plan-result">No cities found</div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleUseMyLocation}
            disabled={geo.status === "loading"}
            className="link-ink disabled:opacity-50"
          >
            <svg className="plan-pin" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
