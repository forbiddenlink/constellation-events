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
  const fromDate = fromParam ? new Date(fromParam) : new Date();
  
  const daysParam = searchParams.get("days");
  const daysAhead = daysParam ? parseInt(daysParam, 10) : 60;

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
