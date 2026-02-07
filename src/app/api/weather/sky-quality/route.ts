import { NextResponse } from "next/server";
import { fetchSkyQuality } from "@/lib/weather";
import { parseCoordinates } from "@/lib/geo";
import { config } from "@/lib/config";

/**
 * GET /api/weather/sky-quality
 * 
 * Returns current sky quality metrics for astronomy
 * Query params: lat, lng (optional, defaults to config location)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coords = parseCoordinates(
    searchParams.get("lat"),
    searchParams.get("lng")
  ) ?? config.defaultLocation;

  try {
    const skyQuality = await fetchSkyQuality(coords.lat, coords.lng);

    return NextResponse.json({
      ...skyQuality,
      location: coords,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Weather data unavailable",
        location: coords,
        timestamp: new Date().toISOString(),
        // Return estimated values as fallback
        cloudCover: 50,
        quality: 70,
        seeing: "fair",
        transparency: 50
      },
      { status: 503 }
    );
  }
}
