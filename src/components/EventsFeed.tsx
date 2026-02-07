"use client";

import { useEffect, useState } from "react";
import EventCard from "@/components/EventCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { AstronomyEvent } from "@/lib/events";
import useGeolocation from "@/hooks/useGeolocation";

type EventsResponse = {
  events: AstronomyEvent[];
  location: { lat: number; lng: number } | null;
  generatedAt: string;
};

export default function EventsFeed() {
  const [data, setData] = useState<EventsResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const geo = useGeolocation();

  useEffect(() => {
    setStatus("loading");
    const params = new URLSearchParams();
    if (geo.status === "ready" && geo.lat !== null && geo.lng !== null) {
      params.set("lat", geo.lat.toFixed(4));
      params.set("lng", geo.lng.toFixed(4));
    }

    fetch(`/api/events?${params.toString()}`)
      .then((res) => res.json())
      .then((payload: EventsResponse) => {
        setData(payload);
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
  }, [geo.status, geo.lat, geo.lng]);

  if (status === "loading") {
    return <LoadingSpinner message="Loading upcoming events..." />;
  }

  if (status === "error") {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <div className="text-ember">⚠️ Events unavailable right now</div>
        <p className="mt-2 text-sm text-starlight/70">Please try again later</p>
      </div>
    );
  }

  const events = data?.events ?? [];

  if (events.length === 0) {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <div className="text-starlight/70">No upcoming events in the selected period</div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 text-xs text-starlight/50">
        Showing {events.length} upcoming events
        {data?.location && ` for your location`}
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {events.map((event) => (
          <div key={event.id}>
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </>
  );
}
