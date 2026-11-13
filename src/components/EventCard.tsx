"use client";

import { useState } from "react";
import type { EventItem } from "@/lib/mock";
import type { AstronomyEvent } from "@/lib/events";
import { generateEventICS, downloadICS } from "@/lib/ical";
import LocalTime from "@/components/LocalTime";

type EventCardProps = {
  event: EventItem | AstronomyEvent;
};

// Type guard to check if it's an AstronomyEvent
function isAstronomyEvent(event: EventItem | AstronomyEvent): event is AstronomyEvent {
  return 'dateDisplay' in event;
}

const formatEventDate = (date: Date) => date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function EventCard({ event }: EventCardProps) {
  const [added, setAdded] = useState(false);
  const visibilityBadge = event.visibility;

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
    <article className="field-row">
      <div className="field-row-date">
        {isAstronomyEvent(event) ? (
          <LocalTime iso={event.date} format={formatEventDate} />
        ) : (
          <span>{event.date}</span>
        )}
      </div>
      <div className="field-row-body">
        <h3 className="field-row-title">{event.title}</h3>
        <p className="field-row-meta">
          <span className="capitalize">{visibilityBadge}</span>
          <span aria-hidden="true"> · </span>
          Best window: {event.window}
          {isAstronomyEvent(event) && event.peak && (
            <>
              <span aria-hidden="true"> · </span>
              Peak: {event.peak}
            </>
          )}
        </p>
      </div>
      {calendarEvent && (
        <button
          type="button"
          onClick={handleAddToCalendar}
          aria-label={added ? `${event.title} added to calendar` : `Add ${event.title} to calendar`}
          className="field-row-link"
        >
          {added ? "Added" : "Add to calendar"}
        </button>
      )}
    </article>
  );
}
