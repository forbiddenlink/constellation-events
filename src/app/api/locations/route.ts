import { NextResponse } from "next/server";
import { parseCoordinates } from "@/lib/geo";
import { findNearbyDarkSkyLocations, estimateDarkSkyScore } from "@/lib/locations";
import { config } from "@/lib/config";

/**
 * GET /api/locations
 * 
 * Find dark-sky observation locations near user
 * Query params: lat, lng, maxDistance (km), limit
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coords = parseCoordinates(
    searchParams.get("lat"),
    searchParams.get("lng")
  ) ?? config.defaultLocation;

  const maxDistance = parseInt(searchParams.get("maxDistance") || "200", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  try {
    const locations = findNearbyDarkSkyLocations(coords, maxDistance, limit);
    const userDarkSkyScore = estimateDarkSkyScore(coords);

    return NextResponse.json({
      location: coords,
      userDarkSkyScore,
      locations,
      count: locations.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch locations",
        location: coords
      },
      { status: 500 }
    );
  }
}
