"use client";

import { useEffect, useState } from "react";
import EventCard from "@/components/EventCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { AstronomyEvent } from "@/lib/events";
import useGeolocation, { requestGeolocation } from "@/hooks/useGeolocation";

type EventsResponse = {
  events: AstronomyEvent[];
  location: { lat: number; lng: number } | null;
  generatedAt: string;
};

const FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Meteor showers", value: "meteor" },
  { label: "Planets", value: "planet" },
  { label: "Lunar", value: "lunar" },
  { label: "Deep sky", value: "deep-sky" },
  { label: "Conjunctions", value: "conjunction" },
];

function matchesFilter(event: AstronomyEvent, filter: string): boolean {
  if (filter === "all") return true;
  const type = (event.type ?? event.title).toLowerCase();
  switch (filter) {
    case "meteor":
      return type.includes("meteor") || type.includes("shower");
    case "planet":
      return type.includes("planet") || type.includes("venus") || type.includes("mars") || type.includes("jupiter") || type.includes("saturn") || type.includes("mercury");
    case "lunar":
      return type.includes("moon") || type.includes("lunar") || type.includes("eclipse");
    case "deep-sky":
      return type.includes("deep") || type.includes("nebula") || type.includes("galaxy") || type.includes("cluster");
    case "conjunction":
      return type.includes("conjunction") || type.includes("alignment") || type.includes("appulse");
    default:
      return true;
  }
}

export default function EventsFeedWithFilters() {
  const [data, setData] = useState<EventsResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [activeFilter, setActiveFilter] = useState("all");
  const geo = useGeolocation();

  useEffect(() => {
    setStatus("loading");
    const params = new URLSearchParams();
    if (geo.status === "ready" && geo.lat !== null && geo.lng !== null) {
      params.set("lat", geo.lat.toFixed(4));
      params.set("lng", geo.lng.toFixed(4));
    }

    fetch(`/api/events?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Events request failed: ${res.status}`);
        return res.json();
      })
      .then((payload: EventsResponse) => {
        setData(payload);
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
  }, [geo.status, geo.lat, geo.lng]);

  const allEvents = data?.events ?? [];
  const filtered = allEvents.filter((e) => matchesFilter(e, activeFilter));

  return (
    <>
      {/* Filter bar */}
      <div className="glass rounded-3xl p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Filters</div>
            <div className="mt-4 flex flex-wrap gap-3">
              {FILTER_OPTIONS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`rounded-full border px-4 py-2 text-xs transition-all ${
                    activeFilter === filter.value
                      ? "border-aurora text-aurora bg-aurora/10"
                      : "border-white/10 text-starlight/70 hover:border-white/20 hover:text-starlight"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-starlight/70">
              {geo.status === "ready" ? "Visibility scores calibrated to your location." : "Set your location to recalibrate visibility scores and recommended times."}
            </p>
            {geo.status !== "ready" && (
              <button
                onClick={requestGeolocation}
                disabled={geo.status === "loading"}
                className="mt-2 flex items-center gap-1.5 text-xs text-aurora hover:text-aurora/80 transition disabled:opacity-50"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {geo.status === "loading" ? "Locating..." : "Set location"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feed */}
      {status === "loading" && <LoadingSpinner message="Loading upcoming events..." />}

      {status === "error" && (
        <div className="glass rounded-3xl p-8 text-center">
          <div className="text-ember">Events unavailable right now</div>
          <p className="mt-2 text-sm text-starlight/70">Please try again later</p>
        </div>
      )}

      {status === "idle" && filtered.length === 0 && (
        <div className="glass rounded-3xl p-8 text-center">
          <div className="text-starlight/70">
            {activeFilter === "all"
              ? "No upcoming events found"
              : `No ${FILTER_OPTIONS.find((f) => f.value === activeFilter)?.label.toLowerCase() ?? ""} events found`}
          </div>
          {activeFilter !== "all" && (
            <button
              onClick={() => setActiveFilter("all")}
              className="mt-3 text-xs text-aurora hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {status === "idle" && filtered.length > 0 && (
        <>
          <div className="mb-4 flex items-center justify-between text-xs text-starlight/50">
            <span>
              Showing {filtered.length} {activeFilter !== "all" ? "filtered " : ""}event{filtered.length !== 1 ? "s" : ""}
              {data?.location && " for your location"}
            </span>
            {data?.generatedAt && (
              <span>Updated {new Date(data.generatedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
            )}
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {filtered.map((event) => (
              <div key={event.id}>
                <EventCard event={event} />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
