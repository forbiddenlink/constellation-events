import { NextResponse } from "next/server";
import { parseCoordinates } from "@/lib/geo";
import { config } from "@/lib/config";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import {
  getISSPasses,
  getISSPosition,
  formatPassTime,
  azimuthToDirection,
  type ISSPass
} from "@/lib/iss";

/**
 * GET /api/iss
 *
 * Get ISS current position and upcoming visible passes
 * Query params:
 *   - lat, lng: Location coordinates (optional, defaults to config)
 *   - count: Number of passes to return (default 5, max 10)
 */
export async function GET(request: Request) {
  const rateLimit = checkRateLimit(
    `iss:${getClientIp(request)}`,
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

  try {
    const [position, passes] = await Promise.all([
      getISSPosition(),
      getISSPasses(coords, { count })
    ]);

    const formattedPasses = passes.map((pass) => ({
      ...pass,
      risetime: pass.risetime.toISOString(),
      formatted: {
        time: formatPassTime(pass),
        riseDirection: azimuthToDirection(pass.riseAzimuth),
        setDirection: azimuthToDirection(pass.setAzimuth),
        maxAltitude: `${Math.round(pass.maxAltitude)}°`
      }
    }));

    return NextResponse.json({
      position: position
        ? {
            ...position,
            timestamp: position.timestamp.toISOString()
          }
        : null,
      passes: formattedPasses,
      location: coords,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch ISS data",
        position: null,
        passes: [],
        location: coords,
        generatedAt: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
