/**
 * ISS-specific tracking utilities
 *
 * Provides convenience functions specifically for ISS tracking,
 * which is the most popular satellite to observe.
 */

import type {
  TLEData,
  SatellitePass,
  SatellitePosition,
  GroundTrackPoint,
  ObserverLocation,
  PassPredictionOptions,
} from "./types";
import { fetchTLE } from "./tle";
import { propagatePosition, generateGroundTrack } from "./propagate";
import { calculatePasses, formatPass, getNextVisiblePass } from "./passes";

// ISS NORAD catalog number
export const ISS_NORAD_ID = 25544;

// Fallback API endpoints
const OPEN_NOTIFY_POSITION_URL = "http://api.open-notify.org/iss-now.json";

export interface ISSOrbitData {
  position: SatellitePosition;
  groundTrack: GroundTrackPoint[];
  nextPasses: SatellitePass[];
  tle: TLEData | null;
  source: "satellite.js" | "api" | "estimated";
  crew?: ISSCrewMember[];
}

export interface ISSCrewMember {
  name: string;
  craft: string;
}

/**
 * Get ISS TLE data
 */
export async function getISSTLE(): Promise<TLEData | null> {
  return fetchTLE(ISS_NORAD_ID);
}

/**
 * Get current ISS position
 */
export async function getISSPosition(): Promise<SatellitePosition | null> {
  // First try satellite.js with TLE
  const tle = await getISSTLE();
  if (tle) {
    const position = propagatePosition(tle);
    if (position) {
      return position;
    }
  }

  // Fallback to API
  try {
    const response = await fetch(OPEN_NOTIFY_POSITION_URL, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      message: string;
      iss_position?: { latitude: string; longitude: string };
      timestamp?: number;
    };

    if (data.message !== "success" || !data.iss_position) return null;

    return {
      latitude: parseFloat(data.iss_position.latitude),
      longitude: parseFloat(data.iss_position.longitude),
      altitude: 420, // Average ISS altitude
      velocity: 27600, // Average ISS velocity km/h
      timestamp: new Date((data.timestamp ?? Date.now() / 1000) * 1000),
    };
  } catch (error) {
    console.warn("[satellite/iss] Failed to fetch ISS position:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Get ISS ground track for the next orbit
 */
export async function getISSGroundTrack(
  durationMinutes: number = 90
): Promise<GroundTrackPoint[]> {
  const tle = await getISSTLE();
  if (!tle) return [];

  return generateGroundTrack(tle, durationMinutes);
}

/**
 * Get upcoming ISS passes for a location
 */
export async function getISSPasses(
  observer: ObserverLocation,
  options?: PassPredictionOptions
): Promise<SatellitePass[]> {
  const tle = await getISSTLE();
  if (!tle) return [];

  return calculatePasses(tle, observer, {
    count: 5,
    minElevation: 10,
    hoursAhead: 72,
    ...options,
  });
}

/**
 * Get next visible ISS pass
 */
export async function getNextISSPass(
  observer: ObserverLocation
): Promise<SatellitePass | null> {
  const tle = await getISSTLE();
  if (!tle) return null;

  return getNextVisiblePass(tle, observer);
}

/**
 * Get complete ISS orbit data
 */
export async function getISSOrbitData(
  observer: ObserverLocation,
  options: { passCount?: number; trackMinutes?: number } = {}
): Promise<ISSOrbitData> {
  const { passCount = 5, trackMinutes = 90 } = options;

  const tle = await getISSTLE();

  if (tle) {
    const position = propagatePosition(tle);
    const groundTrack = generateGroundTrack(tle, trackMinutes);
    const nextPasses = calculatePasses(tle, observer, { count: passCount });

    if (position) {
      return {
        position,
        groundTrack,
        nextPasses,
        tle,
        source: "satellite.js",
      };
    }
  }

  // Fallback to API
  const position = await getISSPosition();

  return {
    position: position ?? {
      latitude: 0,
      longitude: 0,
      altitude: 420,
      velocity: 27600,
      timestamp: new Date(),
    },
    groundTrack: [],
    nextPasses: [],
    tle: null,
    source: position ? "api" : "estimated",
  };
}

/**
 * Get ISS crew members (if available)
 */
export async function getISSCrew(): Promise<ISSCrewMember[]> {
  try {
    const response = await fetch("http://api.open-notify.org/astros.json", {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return [];

    const data = (await response.json()) as {
      message: string;
      people?: Array<{ name: string; craft: string }>;
    };

    if (data.message !== "success" || !data.people) return [];

    // Filter to only ISS crew
    return data.people.filter((person) => person.craft === "ISS");
  } catch {
    return [];
  }
}

/**
 * Format ISS pass for display
 */
export function formatISSPass(pass: SatellitePass): {
  time: string;
  duration: string;
  maxElevation: string;
  direction: string;
  brightness: string;
  description: string;
} {
  const base = formatPass(pass);

  // ISS-specific description
  let description: string;
  if (pass.maxElevation > 60) {
    description = "Excellent pass - ISS will cross high overhead";
  } else if (pass.maxElevation > 40) {
    description = "Good pass - clearly visible";
  } else if (pass.maxElevation > 20) {
    description = "Fair pass - visible above horizon";
  } else {
    description = "Low pass - may be difficult to spot";
  }

  return {
    ...base,
    description,
  };
}

/**
 * Check if ISS is currently visible from a location
 */
export async function isISSVisible(
  observer: ObserverLocation
): Promise<{
  visible: boolean;
  elevation: number | null;
  azimuth: number | null;
  direction: string | null;
}> {
  const tle = await getISSTLE();
  if (!tle) {
    return { visible: false, elevation: null, azimuth: null, direction: null };
  }

  const position = propagatePosition(tle);
  if (!position) {
    return { visible: false, elevation: null, azimuth: null, direction: null };
  }

  // Calculate look angles from observer
  const observerGd = {
    longitude: (observer.longitude * Math.PI) / 180,
    latitude: (observer.latitude * Math.PI) / 180,
    height: (observer.altitude ?? 0) / 1000,
  };

  // We need to recalculate with observer
  const { propagatePositionForObserver } = await import("./propagate");
  const observerPosition = propagatePositionForObserver(tle, observer);

  if (!observerPosition || observerPosition.elevation === undefined) {
    return { visible: false, elevation: null, azimuth: null, direction: null };
  }

  const visible = observerPosition.elevation > 0;
  const direction = visible && observerPosition.azimuth !== undefined
    ? getCardinalDirection(observerPosition.azimuth)
    : null;

  return {
    visible,
    elevation: observerPosition.elevation,
    azimuth: observerPosition.azimuth ?? null,
    direction,
  };
}

/**
 * Get cardinal direction from azimuth
 */
function getCardinalDirection(azimuth: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(azimuth / 45) % 8;
  return directions[index];
}

/**
 * Get ISS statistics
 */
export const ISS_STATS = {
  altitude: { min: 370, max: 460, average: 420 }, // km
  speed: { orbital: 27600, relative: 7.66 }, // km/h, km/s
  orbitPeriod: 92.9, // minutes
  orbitsPerDay: 15.5,
  mass: 420000, // kg
  length: 109, // meters
  width: 73, // meters
  launchDate: new Date("1998-11-20"),
} as const;
