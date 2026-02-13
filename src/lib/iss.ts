/**
 * ISS (International Space Station) Pass Predictions
 *
 * Uses open-notify.org API for pass predictions
 * Falls back to N2YO API if configured
 */

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
};

const OPEN_NOTIFY_PASSES_URL = "http://api.open-notify.org/iss-pass.json";
const OPEN_NOTIFY_POSITION_URL = "http://api.open-notify.org/iss-now.json";
const N2YO_BASE_URL = "https://api.n2yo.com/rest/v1/satellite";
const ISS_NORAD_ID = 25544;

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
    signal: AbortSignal.timeout(10000),
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
