import { NextResponse } from "next/server";
import { parseCoordinates } from "@/lib/geo";
import { generateUpcomingEvents } from "@/lib/events";

/**
 * GET /api/events
 * 
 * Returns upcoming astronomy events (meteor showers, moon phases, planetary events)
 * Query params: lat, lng, from (ISO date), days (number of days ahead)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coords = parseCoordinates(searchParams.get("lat"), searchParams.get("lng"));
  
  // Parse date range
  const fromParam = searchParams.get("from");
  const parsedFrom = fromParam ? new Date(fromParam) : new Date();
  const fromDate = Number.isNaN(parsedFrom.getTime()) ? new Date() : parsedFrom;
  
  const daysParam = searchParams.get("days");
  const parsedDays = daysParam ? parseInt(daysParam, 10) : 60;
  const daysAhead = Number.isNaN(parsedDays) ? 60 : Math.max(1, Math.min(parsedDays, 365));

  const events = generateUpcomingEvents(coords ?? undefined, fromDate, daysAhead);

  return NextResponse.json({
    location: coords ? { lat: coords.lat, lng: coords.lng } : null,
    events,
    generatedAt: new Date().toISOString(),
    dateRange: {
      from: fromDate.toISOString(),
      to: new Date(fromDate.getTime() + daysAhead * 24 * 60 * 60 * 1000).toISOString()
    }
  });
}
