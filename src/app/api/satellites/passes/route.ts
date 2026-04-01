import { NextResponse } from "next/server";
import { parseCoordinates } from "@/lib/geo";
import { config } from "@/lib/config";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import {
  fetchTLE,
  calculatePasses,
  formatPass,
  POPULAR_SATELLITES,
} from "@/lib/satellite";

/**
 * GET /api/satellites/passes
 *
 * Get upcoming passes for any satellite from CelesTrak catalog
 * Query params:
 *   - lat, lng: Observer location coordinates (required for accurate passes)
 *   - norad: NORAD catalog ID of the satellite (default: 25544 for ISS)
 *   - count: Number of passes to return (default 5, max 20)
 *   - minEl: Minimum elevation in degrees (default 10)
 *   - hours: Hours ahead to search (default 72, max 168)
 *   - visible: Only include visible passes (default false)
 */
export async function GET(request: Request) {
  const rateLimit = checkRateLimit(
    `satellites:passes:${getClientIp(request)}`,
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

  // Parse NORAD ID (default to ISS)
  const noradParam = searchParams.get("norad");
  const noradId = noradParam ? parseInt(noradParam, 10) : 25544;

  if (isNaN(noradId) || noradId < 1) {
    return NextResponse.json(
      { error: "Invalid NORAD ID" },
      { status: 400 }
    );
  }

  // Parse options
  const countParam = searchParams.get("count");
  const count = Math.min(20, Math.max(1, parseInt(countParam ?? "5", 10) || 5));

  const minElParam = searchParams.get("minEl");
  const minElevation = Math.max(0, Math.min(90, parseInt(minElParam ?? "10", 10) || 10));

  const hoursParam = searchParams.get("hours");
  const hoursAhead = Math.max(1, Math.min(168, parseInt(hoursParam ?? "72", 10) || 72));

  const visibleOnly = searchParams.get("visible") === "true";

  try {
    // Fetch TLE for the satellite
    const tle = await fetchTLE(noradId);

    if (!tle) {
      return NextResponse.json(
        {
          error: `Satellite with NORAD ID ${noradId} not found`,
          suggestion: "Check the NORAD catalog ID or try a different satellite",
          popularSatellites: POPULAR_SATELLITES.map((s) => ({
            name: s.name,
            noradId: s.noradId,
            description: s.description,
          })),
        },
        { status: 404 }
      );
    }

    // Calculate passes
    const passes = calculatePasses(
      tle,
      { latitude: coords.lat, longitude: coords.lng },
      {
        count,
        minElevation,
        hoursAhead,
        visibleOnly,
      }
    );

    const formattedPasses = passes.map((pass) => ({
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
      formatted: formatPass(pass),
    }));

    return NextResponse.json({
      satellite: {
        name: tle.name,
        noradId: tle.noradId,
      },
      observer: coords,
      passes: formattedPasses,
      searchParams: {
        count,
        minElevation,
        hoursAhead,
        visibleOnly,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[api/satellites/passes] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to calculate passes",
        satellite: { noradId },
        observer: coords,
        passes: [],
        generatedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
