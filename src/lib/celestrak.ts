/**
 * CelesTrak TLE Data Fetcher
 * Fetches live Two-Line Element sets from CelesTrak (https://celestrak.org)
 * for real-time satellite tracking. No API key required.
 *
 * Used with satellite.js (already in deps) for position propagation.
 */

export interface TLEEntry {
  name: string;
  line1: string;
  line2: string;
  /** NORAD catalog ID parsed from line 1 */
  noradId: string;
}

/** CelesTrak GP data API (JSON) – preferred over TLE text for structured data */
const CELESTRAK_GP_API = "https://celestrak.org/SOCRATES/query.php";
const CELESTRAK_TLE_API = "https://celestrak.org/SOCRATES/query.php";

/** Commonly used group IDs from celestrak.org/SOCRATES/doc/catalog-groups.php */
export const CELESTRAK_GROUPS = {
  /** International Space Station */
  ISS: "stations",
  /** Weather satellites */
  WEATHER: "weather",
  /** GPS satellites */
  GPS: "gps-ops",
  /** Iridium constellation */
  IRIDIUM: "iridium",
  /** Starlink constellation */
  STARLINK: "starlink",
  /** Amateur radio satellites */
  AMATEUR: "amateur",
  /** Brightest 100 satellites */
  VISUAL: "100brightest",
} as const;

// ─── TLE Text Parser ──────────────────────────────────────────────────────────

/**
 * Parse raw 3-line TLE text (name + line1 + line2 groups) into TLEEntry[].
 */
export function parseTLEText(raw: string): TLEEntry[] {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const entries: TLEEntry[] = [];
  for (let i = 0; i + 2 < lines.length; i += 3) {
    const name = lines[i].replace(/^0 /, "");
    const line1 = lines[i + 1];
    const line2 = lines[i + 2];
    if (line1.startsWith("1") && line2.startsWith("2")) {
      const noradId = line1.slice(2, 7).trim();
      entries.push({ name, line1, line2, noradId });
    }
  }
  return entries;
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

/**
 * Fetch TLE data for a named group from CelesTrak.
 * Results are cached server-side for 1 hour (TLE data valid ~24 hr).
 */
export async function fetchTLEGroup(
  group: string,
  signal?: AbortSignal,
): Promise<TLEEntry[]> {
  const url = `https://celestrak.org/SOCRATES/query.php?GROUP=${encodeURIComponent(group)}&FORMAT=TLE`;
  // Use the cleaner GP endpoint with JSON when available
  const gpUrl = `https://celestrak.org/SOCRATES/query.php?GROUP=${encodeURIComponent(group)}&FORMAT=JSON`;

  try {
    // Try JSON first
    const jsonRes = await fetch(gpUrl, {
      signal,
      next: { revalidate: 3600 },
    } as RequestInit);

    if (jsonRes.ok) {
      const json = await jsonRes.json();
      if (Array.isArray(json)) {
        return json.map((sat: Record<string, string>) => ({
          name: sat.OBJECT_NAME,
          line1: sat.TLE_LINE1,
          line2: sat.TLE_LINE2,
          noradId: sat.NORAD_CAT_ID,
        }));
      }
    }
  } catch {
    // fall through to TLE text format
  }

  // Fallback: plain TLE text format
  const res = await fetch(url, {
    signal,
    next: { revalidate: 3600 },
  } as RequestInit);

  if (!res.ok) {
    throw new Error(`CelesTrak fetch failed: ${res.status} ${res.statusText}`);
  }

  return parseTLEText(await res.text());
}

/**
 * Fetch TLE for a single satellite by NORAD catalog ID.
 */
export async function fetchTLEByNoradId(
  noradId: string | number,
  signal?: AbortSignal,
): Promise<TLEEntry | null> {
  const url = `https://celestrak.org/SOCRATES/query.php?CATNR=${noradId}&FORMAT=TLE`;
  try {
    const res = await fetch(url, {
      signal,
      next: { revalidate: 3600 },
    } as RequestInit);
    if (!res.ok) return null;
    const entries = parseTLEText(await res.text());
    return entries[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch the ISS TLE — convenience wrapper often needed for demos.
 */
export async function fetchISStle(): Promise<TLEEntry | null> {
  // NORAD ID 25544 = ISS
  return fetchTLEByNoradId(25544);
}
