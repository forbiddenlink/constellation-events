"use client";

import { useEffect, useState } from "react";
import EventCard from "@/components/EventCard";
import type { EventItem } from "@/lib/mock";
import useGeolocation from "@/hooks/useGeolocation";

type EventsResponse = {
  events: (EventItem & { visibilityScore?: number })[];
  location: { lat: string; lng: string } | null;
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
    return <div className="text-sm text-starlight/60">Loading event visibility...</div>;
  }

  if (status === "error") {
    return <div className="text-sm text-ember">Events unavailable right now.</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {(data?.events ?? []).map((event) => (
        <div key={event.id} className="space-y-3">
          <EventCard event={event} />
          {event.visibilityScore ? (
            <div className="text-xs text-starlight/50">Visibility score: {event.visibilityScore}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
