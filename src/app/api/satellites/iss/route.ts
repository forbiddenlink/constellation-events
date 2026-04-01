import { NextResponse } from "next/server";
import { parseCoordinates } from "@/lib/geo";
import { config } from "@/lib/config";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import {
  getISSOrbitData,
  formatISSPass,
  getISSCrew,
  ISS_STATS,
} from "@/lib/satellite";

/**
 * GET /api/satellites/iss
 *
 * Get current ISS position, upcoming passes, and orbit data
 * Query params:
 *   - lat, lng: Observer location coordinates (optional, defaults to config)
 *   - count: Number of passes to return (default 5, max 10)
 *   - track: Include ground track data (default false)
 *   - crew: Include current crew list (default false)
 */
export async function GET(request: Request) {
  const rateLimit = checkRateLimit(
    `satellites:iss:${getClientIp(request)}`,
    RATE_LIMITS.externalApi
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfterSeconds: rateLimit.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const coords = parseCoordinates(
    searchParams.get("lat"),
    searchParams.get("lng")
  ) ?? config.defaultLocation;

  const countParam = searchParams.get("count");
  const count = Math.min(10, Math.max(1, parseInt(countParam ?? "5", 10) || 5));
  const includeTrack = searchParams.get("track") === "true";
  const includeCrew = searchParams.get("crew") === "true";

  try {
    const [orbitData, crew] = await Promise.all([
      getISSOrbitData(
        { latitude: coords.lat, longitude: coords.lng },
        { passCount: count }
      ),
      includeCrew ? getISSCrew() : Promise.resolve([]),
    ]);

    const formattedPasses = orbitData.nextPasses.map((pass) => ({
      startTime: pass.startTime.toISOString(),
      endTime: pass.endTime.toISOString(),
      maxElevation: pass.maxElevation,
      maxElevationTime: pass.maxElevationTime.toISOString(),
      startAzimuth: pass.startAzimuth,
      endAzimuth: pass.endAzimuth,
      direction: pass.direction,
      magnitude: pass.magnitude,
      brightness: pass.brightness,
      duration: pass.duration,
      formatted: formatISSPass(pass),
    }));

    return NextResponse.json({
      position: {
        latitude: orbitData.position.latitude,
        longitude: orbitData.position.longitude,
        altitude: orbitData.position.altitude,
        velocity: orbitData.position.velocity,
        timestamp: orbitData.position.timestamp.toISOString(),
        footprint: orbitData.position.footprint,
      },
      passes: formattedPasses,
      groundTrack: includeTrack
        ? orbitData.groundTrack.map((point) => ({
            lat: point.lat,
            lng: point.lng,
            time: point.time.toISOString(),
            altitude: point.altitude,
          }))
        : undefined,
      crew: includeCrew ? crew : undefined,
      stats: ISS_STATS,
      observer: coords,
      source: orbitData.source,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[api/satellites/iss] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch ISS data",
        position: null,
        passes: [],
        observer: coords,
        source: "error",
        generatedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
