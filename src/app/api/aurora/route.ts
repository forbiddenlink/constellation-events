import { NextResponse } from "next/server";
import { fetchAuroraForecast } from "@/lib/aurora";
import { parseCoordinates } from "@/lib/geo";
import { config } from "@/lib/config";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * GET /api/aurora
 *
 * Returns current aurora forecast and Kp index
 * Query params: lat (optional, defaults to config location)
 */
export async function GET(request: Request) {
  const rateLimit = checkRateLimit(
    `aurora:${getClientIp(request)}`,
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

  const forecast = await fetchAuroraForecast(coords.lat);
  return NextResponse.json({
    ...forecast,
    location: { lat: coords.lat },
    timestamp: new Date().toISOString()
  });
}
