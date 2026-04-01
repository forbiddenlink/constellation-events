/**
 * constellation-events - iCalendar export utility
 * Generates .ics files for astronomy events (eclipses, meteor showers, etc.)
 */
import ical, { ICalCalendarMethod } from "ical-generator";

export interface AstronomyEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  url?: string;
}

export function generateEventICS(event: AstronomyEvent): string {
  const calendar = ical({
    name: "Constellation Events",
    method: ICalCalendarMethod.REQUEST,
    prodId: "//Constellation Events//EN",
  });

  calendar.createEvent({
    id: event.id,
    start: event.startDate,
    end: event.endDate ?? new Date(event.startDate.getTime() + 3600000),
    summary: event.title,
    description: event.description,
    location: event.location,
    url: event.url,
    allDay: !event.endDate,
  });

  return calendar.toString();
}

export function generateEventsICS(events: AstronomyEvent[]): string {
  const calendar = ical({
    name: "Constellation Events",
    prodId: "//Constellation Events//EN",
  });

  for (const event of events) {
    calendar.createEvent({
      id: event.id,
      start: event.startDate,
      end: event.endDate ?? new Date(event.startDate.getTime() + 3600000),
      summary: event.title,
      description: event.description,
      location: event.location,
      url: event.url,
    });
  }

  return calendar.toString();
}

export function downloadICS(icsContent: string, filename: string): void {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
