import { NextResponse } from "next/server";
import { clamp } from "@/lib/geo";
import { parseCoordinates } from "@/lib/geo";
import { findNearbyDarkSkyLocations, estimateDarkSkyScore } from "@/lib/locations";
import { config } from "@/lib/config";
import { calculateMoonPhase } from "@/lib/astronomy";
import { fetchSkyQuality } from "@/lib/weather";

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
    const [skyQuality, moonPhase] = await Promise.all([
      fetchSkyQuality(coords.lat, coords.lng).catch(() => null),
      Promise.resolve(calculateMoonPhase())
    ]);

    const moonPenalty = Math.round(moonPhase.illumination * 0.1);
    const weatherAdjustment = skyQuality ? Math.round((skyQuality.quality - 60) * 0.2) : 0;

    const locations = findNearbyDarkSkyLocations(coords, maxDistance, limit)
      .map((location, index) => ({
        ...location,
        darkSkyScore: clamp(
          location.darkSkyScore - moonPenalty + weatherAdjustment - index,
          25,
          99
        )
      }))
      .sort((a, b) => b.darkSkyScore - a.darkSkyScore);

    const userDarkSkyScore = clamp(
      estimateDarkSkyScore(coords) - moonPenalty + weatherAdjustment,
      20,
      99
    );

    return NextResponse.json({
      location: coords,
      userDarkSkyScore,
      conditions: {
        moonIllumination: moonPhase.illumination,
        weatherQuality: skyQuality?.quality ?? null,
        cloudCover: skyQuality?.cloudCover ?? null,
        weatherSource: skyQuality?.source ?? null
      },
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
