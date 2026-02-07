import { NextResponse } from "next/server";
import { nearbyLocations } from "@/lib/mock";
import { darkSkyScore, parseCoordinates } from "@/lib/geo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coords = parseCoordinates(searchParams.get("lat"), searchParams.get("lng"));

  const scoreBase = coords ? darkSkyScore(coords) : 86;

  const spots = nearbyLocations.map((spot, index) => ({
    ...spot,
    darkSkyScore: Math.max(55, scoreBase - index * 4)
  }));

  return NextResponse.json({
    location: coords ? { lat: String(coords.lat), lng: String(coords.lng) } : null,
    spots
  });
}
