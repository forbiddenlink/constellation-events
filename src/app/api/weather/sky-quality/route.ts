import { NextResponse } from "next/server";
import { fetchSkyQuality } from "@/lib/weather";
import { parseCoordinates } from "@/lib/geo";
import { config } from "@/lib/config";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * GET /api/weather/sky-quality
 *
 * Returns current sky quality metrics for astronomy
 * Query params: lat, lng (optional, defaults to config location)
 */
export async function GET(request: Request) {
  const rateLimit = checkRateLimit(
    `weather:${getClientIp(request)}`,
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

  const skyQuality = await fetchSkyQuality(coords.lat, coords.lng);
  return NextResponse.json({
    ...skyQuality,
    location: coords,
    timestamp: new Date().toISOString()
  });
}
