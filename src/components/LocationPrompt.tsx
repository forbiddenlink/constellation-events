"use client";

import useGeolocation, { requestGeolocation } from "@/hooks/useGeolocation";

export default function LocationPrompt() {
  const geo = useGeolocation();

  if (geo.status === "ready") {
    return (
      <div
        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-aurora/80"
        title={`Location: ${geo.lat?.toFixed(2)}, ${geo.lng?.toFixed(2)}`}
      >
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        <span className="hidden sm:inline">Active</span>
      </div>
    );
  }

  if (geo.status === "loading") {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-starlight/50">
        <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="hidden sm:inline">Locating...</span>
      </div>
    );
  }

  if (geo.status === "error") {
    return (
      <button
        onClick={requestGeolocation}
        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-starlight/50 transition hover:bg-white/10 hover:text-starlight"
        title="Location unavailable — click to retry"
      >
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        <span className="hidden sm:inline">Default</span>
      </button>
    );
  }

  // status === "idle" — no location set yet
  return (
    <button
      onClick={requestGeolocation}
      className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-starlight/60 transition hover:bg-white/10 hover:text-white"
      title="Use your location for personalized sky data"
    >
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span>Set location</span>
    </button>
  );
}
