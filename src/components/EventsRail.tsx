"use client";

import { useEffect, useRef, useState } from "react";
import type { AstronomyEvent } from "@/lib/events";

type EventsResponse = {
  events: AstronomyEvent[];
  generatedAt: string;
};

// Star tint per event type — mirrors the constellation map palette.
const TYPE_COLORS: Record<AstronomyEvent["type"], string> = {
  moon: "#F1F5F9",
  meteor: "#38BDF8",
  planet: "#818CF8",
  eclipse: "#F472B6",
  conjunction: "#34D399",
  other: "#FBBF24",
};

export default function EventsRail() {
  const [events, setEvents] = useState<AstronomyEvent[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/events?days=180")
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json() as Promise<EventsResponse>;
      })
      .then((data) => {
        setEvents(data.events);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const scrollByCards = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  if (status === "error") return null;

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Scrub the timeline</div>
          <p className="mt-1 text-sm text-starlight/60">
            Slide through the coming nights, one celestial event at a time.
          </p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            aria-label="Scroll to earlier events"
            className="rounded-full border border-white/10 bg-white/5 p-2 text-starlight/70 transition hover:border-aurora/40 hover:text-aurora"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            aria-label="Scroll to later events"
            className="rounded-full border border-white/10 bg-white/5 p-2 text-starlight/70 transition hover:border-aurora/40 hover:text-aurora"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:thin]"
        role="list"
        aria-label="Upcoming celestial events timeline"
      >
        {status === "loading" &&
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="w-56 flex-shrink-0 snap-center rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
              <div className="mt-4 h-4 w-32 animate-pulse rounded bg-white/10" />
              <div className="mt-2 h-3 w-24 animate-pulse rounded bg-white/5" />
            </div>
          ))}

        {status === "ready" &&
          events.map((event) => {
            const color = TYPE_COLORS[event.type] ?? TYPE_COLORS.other;
            const glow = Math.max(0.2, Math.min(1, event.visibilityScore / 100));
            return (
              <div
                key={event.id}
                role="listitem"
                className="group w-56 flex-shrink-0 snap-center rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:-translate-y-1 hover:border-aurora/30"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-starlight/50">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2 w-2 rounded-full animate-pulseSoft motion-reduce:animate-none"
                    style={{ backgroundColor: color, boxShadow: `0 0 ${6 + glow * 10}px ${color}` }}
                  />
                  {event.dateDisplay}
                </div>
                <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-starlight">{event.title}</h3>
                <p className="mt-2 line-clamp-2 text-xs text-starlight/60">{event.summary}</p>
                <div className="mt-3 flex items-center justify-between text-[10px] text-starlight/40">
                  <span>{event.window}</span>
                  <span className="text-aurora/80">vis {Math.round(event.visibilityScore)}</span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
