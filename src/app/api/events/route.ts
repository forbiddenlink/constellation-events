import { NextResponse } from "next/server";
import { upcomingEvents } from "@/lib/mock";
import { parseCoordinates, visibilityScore } from "@/lib/geo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coords = parseCoordinates(searchParams.get("lat"), searchParams.get("lng"));

  const events = upcomingEvents.map((event, index) => {
    const base = 78 - index * 8;
    return {
      ...event,
      visibilityScore: coords ? visibilityScore(coords, base) : base
    };
  });

  return NextResponse.json({
    location: coords ? { lat: String(coords.lat), lng: String(coords.lng) } : null,
    events
  });
}
