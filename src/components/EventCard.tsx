"use client";

import { useState } from "react";
import type { EventItem } from "@/lib/mock";
import type { AstronomyEvent } from "@/lib/events";
import { generateEventICS, downloadICS } from "@/lib/ical";

type EventCardProps = {
  event: EventItem | AstronomyEvent;
};

// Type guard to check if it's an AstronomyEvent
function isAstronomyEvent(event: EventItem | AstronomyEvent): event is AstronomyEvent {
  return 'dateDisplay' in event;
}

export default function EventCard({ event }: EventCardProps) {
  const [added, setAdded] = useState(false);
  const displayDate = isAstronomyEvent(event) ? event.dateDisplay : event.date;
  const visibilityBadge = event.visibility;

  // Get badge color based on visibility
  const getBadgeColor = (vis: string) => {
    switch(vis.toLowerCase()) {
      case 'excellent': return 'text-aurora border-aurora/30';
      case 'good': return 'text-starlight border-starlight/30';
      case 'fair': return 'text-caution border-caution/30';
      case 'poor': return 'text-ember border-ember/30';
      default: return 'text-starlight/80 border-white/20';
    }
  };

  // Only astronomy events carry a real ISO date we can hand to a calendar.
  const calendarEvent = isAstronomyEvent(event) ? event : null;

  const handleAddToCalendar = () => {
    if (!calendarEvent) return;
    const start = new Date(calendarEvent.date);
    if (Number.isNaN(start.getTime())) return;

    const ics = generateEventICS({
      id: calendarEvent.id,
      title: calendarEvent.title,
      description: `${calendarEvent.summary}${calendarEvent.peak ? `\nPeak: ${calendarEvent.peak}` : ""}\nBest window: ${calendarEvent.window}`,
      startDate: start,
    });
    downloadICS(ics, `${calendarEvent.id}.ics`);

    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="glass rounded-2xl p-5 transition hover:-translate-y-1 hover:shadow-comet">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-starlight/50">
        <span>{displayDate}</span>
        <span className={`rounded-full border px-3 py-1 text-[10px] ${getBadgeColor(visibilityBadge)}`}>
          {visibilityBadge}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-starlight">{event.title}</h3>
      <p className="mt-2 text-sm text-starlight/70">{event.summary}</p>
      <div className="mt-4 text-xs text-starlight/50">
        Best window: {event.window}
        {isAstronomyEvent(event) && event.peak && (
          <span className="block mt-1">Peak: {event.peak}</span>
        )}
      </div>

      {calendarEvent && (
        <button
          type="button"
          onClick={handleAddToCalendar}
          aria-label={added ? `${event.title} added to calendar` : `Add ${event.title} to calendar`}
          className={`relative mt-4 inline-flex items-center gap-2 overflow-hidden rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
            added
              ? "border-aurora/60 text-aurora"
              : "border-white/10 text-starlight/70 hover:border-aurora/40 hover:text-aurora"
          }`}
        >
          {/* Aurora pulse ring on confirm (reuses pulseSoft; gated for reduced motion) */}
          {added && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full bg-aurora/15 animate-pulseSoft motion-reduce:animate-none"
            />
          )}
          <span className="relative flex items-center gap-1.5">
            {added ? (
              <>
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 10.5l4 4 8-9" />
                </svg>
                Added
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Add to calendar
              </>
            )}
          </span>
        </button>
      )}
    </div>
  );
}
