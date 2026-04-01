/**
 * TLE (Two-Line Element) data fetching from CelesTrak
 *
 * TLE data is the standard format for satellite orbital elements.
 * CelesTrak provides free, regularly updated TLE data for most satellites.
 */

import type { TLEData } from "./types";

const CELESTRAK_BASE = "https://celestrak.org/NORAD/elements/gp.php";

// TLE cache with TTL
const tleCache = new Map<number, TLEData>();
const TLE_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

// Common satellite groups from CelesTrak
export const TLE_GROUPS = {
  stations: "stations",
  visualSatellites: "visual",
  weather: "weather",
  starlink: "starlink",
  amateur: "amateur",
  science: "science",
  gps: "gps-ops",
} as const;

export type TLEGroup = (typeof TLE_GROUPS)[keyof typeof TLE_GROUPS];

/**
 * Fetch TLE data for a specific satellite by NORAD ID
 */
export async function fetchTLE(noradId: number): Promise<TLEData | null> {
  // Check cache
  const cached = tleCache.get(noradId);
  if (cached && Date.now() - cached.fetchedAt < TLE_CACHE_TTL) {
    return cached;
  }

  try {
    const url = `${CELESTRAK_BASE}?CATNR=${noradId}&FORMAT=TLE`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`CelesTrak fetch failed: ${response.status}`);
    }

    const text = await response.text();
    const tle = parseTLE(text);

    if (tle) {
      tle.fetchedAt = Date.now();
      tleCache.set(noradId, tle);
      return tle;
    }

    return null;
  } catch (error) {
    console.warn(`[satellite/tle] Failed to fetch TLE for ${noradId}:`, {
      error: error instanceof Error ? error.message : String(error),
    });

    // Return stale cache if available
    return cached ?? null;
  }
}

/**
 * Fetch TLE data for multiple satellites by group
 */
export async function fetchTLEGroup(
  group: TLEGroup
): Promise<Map<number, TLEData>> {
  const results = new Map<number, TLEData>();

  try {
    const url = `${CELESTRAK_BASE}?GROUP=${group}&FORMAT=TLE`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`CelesTrak group fetch failed: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.trim().split("\n");

    // TLE format: Name (line 0), Line 1 (line 1), Line 2 (line 2)
    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 >= lines.length) break;

      const name = lines[i].trim();
      const line1 = lines[i + 1].trim();
      const line2 = lines[i + 2].trim();

      if (line1.startsWith("1 ") && line2.startsWith("2 ")) {
        const noradId = parseInt(line1.substring(2, 7).trim(), 10);
        const tle: TLEData = {
          name,
          line1,
          line2,
          noradId,
          fetchedAt: Date.now(),
        };
        results.set(noradId, tle);
        tleCache.set(noradId, tle);
      }
    }
  } catch (error) {
    console.warn(`[satellite/tle] Failed to fetch TLE group ${group}:`, {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return results;
}

/**
 * Parse TLE text into structured data
 */
function parseTLE(text: string): TLEData | null {
  const lines = text.trim().split("\n").map((l) => l.trim());

  if (lines.length < 3) {
    return null;
  }

  const name = lines[0];
  const line1 = lines[1];
  const line2 = lines[2];

  if (!line1.startsWith("1 ") || !line2.startsWith("2 ")) {
    return null;
  }

  const noradId = parseInt(line1.substring(2, 7).trim(), 10);

  return {
    name,
    line1,
    line2,
    noradId,
    fetchedAt: 0,
  };
}

/**
 * Get TLE age in hours
 */
export function getTLEAge(tle: TLEData): number {
  return (Date.now() - tle.fetchedAt) / (1000 * 60 * 60);
}

/**
 * Check if TLE is stale (older than threshold)
 */
export function isTLEStale(tle: TLEData, maxAgeHours: number = 24): boolean {
  return getTLEAge(tle) > maxAgeHours;
}

/**
 * Clear TLE cache (useful for testing)
 */
export function clearTLECache(): void {
  tleCache.clear();
}

/**
 * Get cached TLE if available
 */
export function getCachedTLE(noradId: number): TLEData | null {
  const cached = tleCache.get(noradId);
  if (cached && Date.now() - cached.fetchedAt < TLE_CACHE_TTL) {
    return cached;
  }
  return null;
}
