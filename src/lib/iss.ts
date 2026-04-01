/**
 * ISS (International Space Station) Pass Predictions
 *
 * Uses satellite.js for accurate TLE-based orbit propagation
 * Falls back to open-notify.org and N2YO APIs
 */

import * as satellite from "satellite.js";
import type { Coordinates } from "@/lib/geo";

export type ISSPass = {
  risetime: Date;
  duration: number; // seconds
  riseAzimuth: number; // degrees
  maxAltitude: number; // degrees
  setAzimuth: number; // degrees
  brightness: "visible" | "possibly-visible" | "not-visible";
};

export type ISSPosition = {
  latitude: number;
  longitude: number;
  altitude: number; // km
  velocity: number; // km/h
  timestamp: Date;
  // Enhanced data from satellite.js
  velocityEci?: { x: number; y: number; z: number };
  footprint?: number; // km - visible ground radius
};

export type ISSOrbitData = {
  position: ISSPosition;
  groundTrack: Array<{ lat: number; lng: number; time: Date }>;
  nextPasses: ISSPass[];
  tle: { line1: string; line2: string } | null;
  source: "satellite.js" | "api" | "estimated";
};

const OPEN_NOTIFY_PASSES_URL = "http://api.open-notify.org/iss-pass.json";
const OPEN_NOTIFY_POSITION_URL = "http://api.open-notify.org/iss-now.json";
const N2YO_BASE_URL = "https://api.n2yo.com/rest/v1/satellite";
const ISS_NORAD_ID = 25544;
const CELESTRAK_TLE_URL = "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE";

// Cache TLE data (valid for ~24 hours typically)
let cachedTLE: { line1: string; line2: string; fetchedAt: number } | null = null;
const TLE_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Fetch current TLE (Two-Line Element) data for ISS from CelesTrak
 */
export async function fetchISSTLE(): Promise<{ line1: string; line2: string } | null> {
  // Return cached TLE if still fresh
  if (cachedTLE && Date.now() - cachedTLE.fetchedAt < TLE_CACHE_TTL) {
    return { line1: cachedTLE.line1, line2: cachedTLE.line2 };
  }

  try {
    const response = await fetch(CELESTRAK_TLE_URL, {
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`CelesTrak TLE fetch failed: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.trim().split("\n").map((l) => l.trim());

    if (lines.length < 3) {
      throw new Error("Invalid TLE format");
    }

    // TLE format: name on line 0, line1 on line 1, line2 on line 2
    const line1 = lines[1];
    const line2 = lines[2];

    if (!line1.startsWith("1 ") || !line2.startsWith("2 ")) {
      throw new Error("Invalid TLE line format");
    }

    cachedTLE = { line1, line2, fetchedAt: Date.now() };
    return { line1, line2 };
  } catch (error) {
    console.warn("[iss] Failed to fetch TLE from CelesTrak:", {
      error: error instanceof Error ? error.message : String(error)
    });
    return cachedTLE ? { line1: cachedTLE.line1, line2: cachedTLE.line2 } : null;
  }
}

/**
 * Calculate ISS position using satellite.js and TLE data
 */
export function calculateISSPosition(
  tle: { line1: string; line2: string },
  time: Date = new Date()
): ISSPosition | null {
  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const positionAndVelocity = satellite.propagate(satrec, time);

    if (
      typeof positionAndVelocity.position === "boolean" ||
      typeof positionAndVelocity.velocity === "boolean"
    ) {
      return null;
    }

    const positionEci = positionAndVelocity.position;
    const velocityEci = positionAndVelocity.velocity;

    // Convert ECI to geodetic coordinates
    const gmst = satellite.gstime(time);
    const positionGd = satellite.eciToGeodetic(positionEci, gmst);

    const latitude = satellite.degreesLat(positionGd.latitude);
    const longitude = satellite.degreesLong(positionGd.longitude);
    const altitude = positionGd.height; // km

    // Calculate velocity magnitude
    const velocityMagnitude = Math.sqrt(
      velocityEci.x ** 2 + velocityEci.y ** 2 + velocityEci.z ** 2
    );

    // Calculate ground footprint radius (simplified)
    // Footprint depends on altitude - approximate using geometric horizon
    const earthRadius = 6371; // km
    const footprint = Math.sqrt(2 * earthRadius * altitude + altitude ** 2);

    return {
      latitude,
      longitude,
      altitude,
      velocity: velocityMagnitude * 3600, // km/s to km/h
      timestamp: time,
      velocityEci: { x: velocityEci.x, y: velocityEci.y, z: velocityEci.z },
      footprint
    };
  } catch (error) {
    console.warn("[iss] satellite.js calculation failed:", {
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Generate ground track path for next N minutes
 */
export function generateGroundTrack(
  tle: { line1: string; line2: string },
  durationMinutes: number = 90, // One full orbit
  intervalSeconds: number = 60
): Array<{ lat: number; lng: number; time: Date }> {
  const track: Array<{ lat: number; lng: number; time: Date }> = [];
  const startTime = new Date();
  const steps = Math.floor((durationMinutes * 60) / intervalSeconds);

  for (let i = 0; i <= steps; i++) {
    const time = new Date(startTime.getTime() + i * intervalSeconds * 1000);
    const position = calculateISSPosition(tle, time);
    if (position) {
      track.push({
        lat: position.latitude,
        lng: position.longitude,
        time
      });
    }
  }

  return track;
}

/**
 * Calculate ISS passes using satellite.js
 * More accurate than API-based predictions
 */
export function calculateISSPasses(
  tle: { line1: string; line2: string },
  coords: Coordinates,
  options: { count?: number; minAltitude?: number; hoursAhead?: number } = {}
): ISSPass[] {
  const { count = 5, minAltitude = 10, hoursAhead = 72 } = options;
  const passes: ISSPass[] = [];
  const observerGd = {
    longitude: satellite.degreesToRadians(coords.lng),
    latitude: satellite.degreesToRadians(coords.lat),
    height: 0 // Ground level
  };

  const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + hoursAhead * 60 * 60 * 1000);

  let currentTime = new Date(startTime);
  let inPass = false;
  let passStart: Date | null = null;
  let maxEl = 0;
  let riseAz = 0;
  let setAz = 0;

  // Step through time looking for passes
  while (currentTime < endTime && passes.length < count) {
    const positionAndVelocity = satellite.propagate(satrec, currentTime);

    if (typeof positionAndVelocity.position !== "boolean") {
      const positionEci = positionAndVelocity.position;
      const gmst = satellite.gstime(currentTime);
      const positionEcf = satellite.eciToEcf(positionEci, gmst);
      const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);

      const elevation = satellite.radiansToDegrees(lookAngles.elevation);
      const azimuth = satellite.radiansToDegrees(lookAngles.azimuth);

      if (elevation > 0 && !inPass) {
        // Pass starting
        inPass = true;
        passStart = new Date(currentTime);
        maxEl = elevation;
        riseAz = azimuth;
      } else if (elevation > 0 && inPass) {
        // During pass
        if (elevation > maxEl) {
          maxEl = elevation;
        }
      } else if (elevation <= 0 && inPass) {
        // Pass ending
        inPass = false;
        setAz = azimuth;

        if (passStart && maxEl >= minAltitude) {
          const duration = (currentTime.getTime() - passStart.getTime()) / 1000;
          passes.push({
            risetime: passStart,
            duration,
            riseAzimuth: riseAz < 0 ? riseAz + 360 : riseAz,
            maxAltitude: maxEl,
            setAzimuth: setAz < 0 ? setAz + 360 : setAz,
            brightness: maxEl > 40 ? "visible" : maxEl > 20 ? "possibly-visible" : "not-visible"
          });
        }
        passStart = null;
        maxEl = 0;
      }
    }

    // Advance time (30 second steps for reasonable accuracy)
    currentTime = new Date(currentTime.getTime() + 30 * 1000);
  }

  return passes;
}

/**
 * Get complete ISS orbit data including real-time position and passes
 */
export async function getISSOrbitData(
  coords: Coordinates,
  options: { passCount?: number; trackMinutes?: number } = {}
): Promise<ISSOrbitData> {
  const { passCount = 5, trackMinutes = 90 } = options;

  // Try to get TLE data for accurate tracking
  const tle = await fetchISSTLE();

  if (tle) {
    const position = calculateISSPosition(tle);
    const groundTrack = generateGroundTrack(tle, trackMinutes);
    const nextPasses = calculateISSPasses(tle, coords, { count: passCount });

    if (position) {
      return {
        position,
        groundTrack,
        nextPasses,
        tle,
        source: "satellite.js"
      };
    }
  }

  // Fallback to API-based data
  const [position, passes] = await Promise.all([
    getISSPosition(),
    getISSPasses(coords, { count: passCount })
  ]);

  return {
    position: position ?? {
      latitude: 0,
      longitude: 0,
      altitude: 420,
      velocity: 27600,
      timestamp: new Date()
    },
    groundTrack: [],
    nextPasses: passes,
    tle: null,
    source: position ? "api" : "estimated"
  };
}

/**
 * Get upcoming ISS passes for a location
 */
export async function getISSPasses(
  coords: Coordinates,
  options: { count?: number; minAltitude?: number } = {}
): Promise<ISSPass[]> {
  const { count = 5, minAltitude = 10 } = options;

  // Try N2YO first if API key is configured (more accurate)
  const n2yoKey = process.env.N2YO_API_KEY?.trim();
  if (n2yoKey) {
    try {
      return await fetchN2YOPasses(coords, n2yoKey, count, minAltitude);
    } catch (error) {
      console.warn("[iss] N2YO API failed, falling back to open-notify:", {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Try open-notify API (simpler but less detailed)
  try {
    return await fetchOpenNotifyPasses(coords, count);
  } catch (error) {
    console.warn("[iss] All ISS pass APIs failed:", {
      error: error instanceof Error ? error.message : String(error)
    });
    return [];
  }
}

/**
 * Get current ISS position
 */
export async function getISSPosition(): Promise<ISSPosition | null> {
  try {
    const response = await fetch(OPEN_NOTIFY_POSITION_URL, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 10 } // Cache for 10 seconds
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
      timestamp: new Date((data.timestamp ?? Date.now() / 1000) * 1000)
    };
  } catch (error) {
    console.warn("[iss] Failed to fetch ISS position:", {
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

async function fetchOpenNotifyPasses(
  coords: Coordinates,
  count: number
): Promise<ISSPass[]> {
  const url = new URL(OPEN_NOTIFY_PASSES_URL);
  url.searchParams.set("lat", String(coords.lat));
  url.searchParams.set("lon", String(coords.lng));
  url.searchParams.set("n", String(count));

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(5000),
    next: { revalidate: 300 } // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(`Open Notify API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    message: string;
    response?: Array<{
      risetime: number;
      duration: number;
    }>;
  };

  if (data.message !== "success" || !data.response) {
    throw new Error("Invalid Open Notify response");
  }

  return data.response.map((pass) => ({
    risetime: new Date(pass.risetime * 1000),
    duration: pass.duration,
    riseAzimuth: 0, // Not provided by open-notify
    maxAltitude: 45, // Estimated average
    setAzimuth: 0, // Not provided by open-notify
    brightness: "possibly-visible" as const
  }));
}

async function fetchN2YOPasses(
  coords: Coordinates,
  apiKey: string,
  count: number,
  minAltitude: number
): Promise<ISSPass[]> {
  // Visual passes endpoint gives more detailed info
  const url = `${N2YO_BASE_URL}/visualpasses/${ISS_NORAD_ID}/${coords.lat}/${coords.lng}/0/${count}/${minAltitude}?apiKey=${apiKey}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    next: { revalidate: 300 }
  });

  if (!response.ok) {
    throw new Error(`N2YO API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    info?: { passescount: number };
    passes?: Array<{
      startUTC: number;
      duration: number;
      startAz: number;
      maxEl: number;
      endAz: number;
      mag: number;
    }>;
  };

  if (!data.passes) {
    return [];
  }

  return data.passes.map((pass) => ({
    risetime: new Date(pass.startUTC * 1000),
    duration: pass.duration,
    riseAzimuth: pass.startAz,
    maxAltitude: pass.maxEl,
    setAzimuth: pass.endAz,
    brightness: getBrightness(pass.mag)
  }));
}

function getBrightness(magnitude: number): ISSPass["brightness"] {
  if (magnitude <= -2) return "visible";
  if (magnitude <= 0) return "possibly-visible";
  return "not-visible";
}

/**
 * Format pass time for display
 */
export function formatPassTime(pass: ISSPass): string {
  const time = pass.risetime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
  const duration = Math.round(pass.duration / 60);
  return `${time} (${duration} min)`;
}

/**
 * Get compass direction from azimuth
 */
export function azimuthToDirection(azimuth: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(azimuth / 22.5) % 16;
  return directions[index];
}
