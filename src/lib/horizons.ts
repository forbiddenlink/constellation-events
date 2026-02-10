import { getCache, setCache } from "@/lib/cache";
import type { Coordinates } from "@/lib/geo";

const HORIZONS_BASE = "https://ssd.jpl.nasa.gov/api/horizons.api";

export type HorizonsTarget = {
  id: string;
  name: string;
  command: string;
  type: string;
};

export type HorizonsPoint = {
  timeLabel: string;
  azimuth: number;
  elevation: number;
};

export type HorizonsResult = {
  points: HorizonsPoint[];
};

const defaultTargets: HorizonsTarget[] = [
  { id: "moon", name: "Moon", command: "301", type: "Moon Phase" },
  { id: "jupiter", name: "Jupiter", command: "599", type: "Planet" },
  { id: "venus", name: "Venus", command: "299", type: "Planet" },
  { id: "saturn", name: "Saturn", command: "699", type: "Planet" },
  { id: "mars", name: "Mars", command: "499", type: "Planet" }
];

export function getDefaultTargets() {
  return defaultTargets;
}

function formatDateForHorizons(date: Date) {
  const iso = new Date(date.getTime()).toISOString();
  const [fullDate, fullTime] = iso.split("T");
  const time = fullTime.slice(0, 5);
  return `${fullDate} ${time}`;
}

function buildObserverUrl(target: HorizonsTarget, coords: Coordinates, start: Date, stop: Date) {
  const params = new URLSearchParams({
    format: "json",
    COMMAND: `'${target.command}'`,
    OBJ_DATA: "NO",
    MAKE_EPHEM: "YES",
    EPHEM_TYPE: "OBSERVER",
    CENTER: "'coord@399'",
    COORD_TYPE: "GEODETIC",
    SITE_COORD: `'${coords.lng.toFixed(5)},${coords.lat.toFixed(5)},0'`,
    START_TIME: `'${formatDateForHorizons(start)}'`,
    STOP_TIME: `'${formatDateForHorizons(stop)}'`,
    STEP_SIZE: "'1 h'",
    QUANTITIES: "'4'",
    CSV_FORMAT: "YES",
    TIME_TYPE: "UT"
  });

  return `${HORIZONS_BASE}?${params.toString()}`;
}

function extractCsvLines(result: string) {
  const start = result.indexOf("$$SOE");
  const end = result.indexOf("$$EOE");
  if (start === -1 || end === -1) return [];
  return result
    .slice(start + 5, end)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseObserverCsv(lines: string[]): HorizonsPoint[] {
  return lines
    .map((line) => line.split(",").map((field) => field.trim()))
    .map((columns) => {
      const timeLabel = columns[0];
      const numeric = columns
        .map((value) => Number.parseFloat(value))
        .filter((value) => Number.isFinite(value));
      if (numeric.length < 2) return null;
      const elevation = numeric[numeric.length - 1];
      const azimuth = numeric[numeric.length - 2];
      return { timeLabel, azimuth, elevation };
    })
    .filter((point): point is HorizonsPoint => Boolean(point));
}

export async function fetchObserverTable(target: HorizonsTarget, coords: Coordinates, windowHours = 8) {
  const start = new Date();
  const stop = new Date(start.getTime() + windowHours * 60 * 60 * 1000);
  const url = buildObserverUrl(target, coords, start, stop);

  const cached = getCache<string>(url);
  if (cached) {
    return parseObserverCsv(extractCsvLines(cached));
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000), // JPL Horizons can be slow
    next: { revalidate: 3600 }
  });
  if (!response.ok) {
    throw new Error(`Horizons request failed: ${response.status}`);
  }
  const payload = (await response.json()) as { result?: string; error?: string };
  if (payload.error) {
    throw new Error(payload.error);
  }
  const result = payload.result ?? "";
  setCache(url, result, 60 * 60 * 1000);
  return parseObserverCsv(extractCsvLines(result));
}
