import { NextResponse } from "next/server";
import { tonightHighlights, type TonightObject } from "@/lib/mock";
import { parseCoordinates } from "@/lib/geo";
import { fetchObserverTable, getDefaultTargets, type HorizonsPoint } from "@/lib/horizons";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

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

    return NextResponse.json({
      highlights: highlights.length ? highlights : tonightHighlights,
      source: highlights.length ? "JPL Horizons" : "mock",
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      highlights: tonightHighlights,
      source: "mock",
      generatedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Horizons unavailable"
    });
  }
}
