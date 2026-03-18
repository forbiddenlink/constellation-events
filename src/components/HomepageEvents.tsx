"use client";

import { useEffect, useState } from "react";
import EventCard from "@/components/EventCard";
import type { AstronomyEvent } from "@/lib/events";

type EventsResponse = {
  events: AstronomyEvent[];
  generatedAt: string;
};

export default function HomepageEvents() {
  const [events, setEvents] = useState<AstronomyEvent[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json() as Promise<EventsResponse>;
      })
      .then((data) => {
        setEvents(data.events.slice(0, 3));
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Upcoming Events</div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass animate-pulse rounded-2xl p-5">
            <div className="h-3 w-20 rounded bg-white/10" />
            <div className="mt-4 h-5 w-40 rounded bg-white/10" />
            <div className="mt-2 h-3 w-full rounded bg-white/5" />
          </div>
        ))}
      </div>
    );
  }

  if (error || events.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Upcoming Events</div>
        <div className="glass rounded-2xl p-5 text-sm text-starlight/40">
          {error ? "Events temporarily unavailable." : "No upcoming events right now."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Upcoming Events</div>
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
