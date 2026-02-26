import { NextResponse } from "next/server";
import { tonightHighlights, type TonightObject } from "@/lib/mock";
import { parseCoordinates } from "@/lib/geo";
import { fetchObserverTable, getDefaultTargets, type HorizonsPoint } from "@/lib/horizons";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { getVisiblePlanets, getMoonInfo, PLANETS } from "@/lib/celestial-engine";

const fallbackLocation = { lat: 36.1147, lng: -115.1728 };

type TableMap = Map<string, HorizonsPoint[]>;

function buildHighlightsFromHorizons(targets: ReturnType<typeof getDefaultTargets>, tables: TableMap) {
  const highlights: TonightObject[] = [];

  targets.forEach((target) => {
    const points = tables.get(target.id) ?? [];
    if (!points.length) return;

    const best = points.reduce((max, point) => (point.elevation > max.elevation ? point : max), points[0]);
    highlights.push({
      id: target.id,
      name: target.name,
      type: target.type,
      bestTime: `${best.timeLabel} UT`,
      magnitude: `${Math.round(best.elevation)}°`,
      metricLabel: "Alt",
      highlight: `Peak elevation ${Math.round(best.elevation)}°`
    });
  });

  return highlights;
}

/**
 * Build highlights from celestial-engine when Horizons is unavailable.
 * Uses client-side ephemeris calculations for accurate fallback data.
 */
function buildHighlightsFromCelestialEngine(
  lat: number,
  lon: number,
  date: Date = new Date()
): TonightObject[] {
  const highlights: TonightObject[] = [];

  // Get moon info
  const moonInfo = getMoonInfo(lat, lon, date);
  if (moonInfo.altitude > 0 || moonInfo.illumination > 20) {
    highlights.push({
      id: "moon",
      name: moonInfo.name,
      type: "Moon Phase",
      bestTime: moonInfo.altitude > 0 ? "Now visible" : "Rising later",
      magnitude: `${Math.round(moonInfo.illumination)}%`,
      metricLabel: "Illum",
      highlight:
        moonInfo.illumination < 25
          ? "Low glare tonight, ideal for deep sky"
          : moonInfo.illumination > 75
            ? "Bright moon - great for lunar features"
            : "Moderate moonlight",
    });
  }

  // Get visible planets
  const visiblePlanets = getVisiblePlanets(lat, lon, date);
  visiblePlanets.forEach((planet) => {
    if (planet.altitude > 15) {
      highlights.push({
        id: planet.name.toLowerCase(),
        name: `${planet.name} ${planet.symbol}`,
        type: "Planet",
        bestTime: `Alt: ${Math.round(planet.altitude)}°`,
        magnitude: `${Math.round(planet.altitude)}°`,
        metricLabel: "Alt",
        highlight: `Currently ${Math.round(planet.altitude)}° above horizon`,
      });
    }
  });

  return highlights;
}

export async function GET(request: Request) {
  const rateLimit = checkRateLimit(
    `sky-tonight:${getClientIp(request)}`,
    RATE_LIMITS.externalApi
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfterSeconds: rateLimit.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const coords = parseCoordinates(searchParams.get("lat"), searchParams.get("lng")) ?? fallbackLocation;

  try {
    const targets = getDefaultTargets();
    const tables = await Promise.all(
      targets.map(async (target) => [target.id, await fetchObserverTable(target, coords)] as const)
    );

    const tableMap: TableMap = new Map(tables);
    const highlights = buildHighlightsFromHorizons(targets, tableMap);

    if (highlights.length > 0) {
      return NextResponse.json({
        highlights,
        source: "JPL Horizons",
        generatedAt: new Date().toISOString(),
      });
    }

    // Horizons returned no data - use celestial-engine
    const celestialHighlights = buildHighlightsFromCelestialEngine(
      coords.lat,
      coords.lng
    );

    return NextResponse.json({
      highlights:
        celestialHighlights.length > 0 ? celestialHighlights : tonightHighlights,
      source: celestialHighlights.length > 0 ? "astronomy-engine" : "mock",
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    // Use celestial-engine for real calculations when Horizons is unavailable
    const celestialHighlights = buildHighlightsFromCelestialEngine(
      coords.lat,
      coords.lng
    );

    return NextResponse.json({
      highlights:
        celestialHighlights.length > 0 ? celestialHighlights : tonightHighlights,
      source: celestialHighlights.length > 0 ? "astronomy-engine" : "mock",
      generatedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Horizons unavailable",
    });
  }
}
