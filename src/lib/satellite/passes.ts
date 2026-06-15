/**
 * Satellite pass prediction
 *
 * Calculates when satellites will be visible from a given location,
 * including elevation, azimuth, and visibility conditions.
 */

import * as satellite from "satellite.js";
import type {
  TLEData,
  SatellitePass,
  ObserverLocation,
  PassPredictionOptions,
} from "./types";
import { isSatelliteSunlit, propagatePosition } from "./propagate";

/**
 * Calculate upcoming passes for a satellite from an observer location
 */
export function calculatePasses(
  tle: TLEData,
  observer: ObserverLocation,
  options: PassPredictionOptions = {}
): SatellitePass[] {
  const {
    count = 5,
    minElevation = 10,
    hoursAhead = 72,
    visibleOnly = false,
  } = options;

  const passes: SatellitePass[] = [];
  const satrec = satellite.twoline2satrec(tle.line1, tle.line2);

  const observerGd = {
    longitude: satellite.degreesToRadians(observer.longitude),
    latitude: satellite.degreesToRadians(observer.latitude),
    height: (observer.altitude ?? 0) / 1000,
  };

  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + hoursAhead * 60 * 60 * 1000);

  let currentTime = new Date(startTime);
  let inPass = false;
  let passStart: Date | null = null;
  let maxEl = 0;
  let maxElTime: Date | null = null;
  let riseAz = 0;
  let setAz = 0;
  let wasSunlit = false;

  // Time step in seconds (finer steps for more accurate predictions)
  const timeStep = 10;

  while (currentTime < endTime && passes.length < count * 2) {
    const positionAndVelocity = satellite.propagate(satrec, currentTime);

    if (positionAndVelocity && typeof positionAndVelocity.position !== "boolean") {
      const positionEci = positionAndVelocity.position;
      const gmst = satellite.gstime(currentTime);
      const positionEcf = satellite.eciToEcf(positionEci, gmst);
      const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);

      const elevation = satellite.radiansToDegrees(lookAngles.elevation);
      const azimuth = normalizeAzimuth(
        satellite.radiansToDegrees(lookAngles.azimuth)
      );

      // Check if satellite is sunlit
      const position = propagatePosition(tle, currentTime);
      const isSunlit = position ? isSatelliteSunlit(position, currentTime) : false;

      if (elevation > 0 && !inPass) {
        // Pass starting
        inPass = true;
        passStart = new Date(currentTime);
        maxEl = elevation;
        maxElTime = new Date(currentTime);
        riseAz = azimuth;
        wasSunlit = isSunlit;
      } else if (elevation > 0 && inPass) {
        // During pass - track max elevation
        if (elevation > maxEl) {
          maxEl = elevation;
          maxElTime = new Date(currentTime);
        }
        // Track if satellite was ever sunlit during pass
        if (isSunlit) {
          wasSunlit = true;
        }
      } else if (elevation <= 0 && inPass) {
        // Pass ending
        inPass = false;
        setAz = azimuth;

        if (passStart && maxElTime && maxEl >= minElevation) {
          const duration = (currentTime.getTime() - passStart.getTime()) / 1000;
          const magnitude = estimateMagnitude(tle, maxEl);
          const brightness = getBrightnessCategory(magnitude);

          // Skip if visibleOnly is true and satellite wasn't sunlit
          if (!visibleOnly || wasSunlit) {
            passes.push({
              startTime: passStart,
              endTime: new Date(currentTime),
              maxElevation: maxEl,
              maxElevationTime: maxElTime,
              startAzimuth: riseAz,
              endAzimuth: setAz,
              direction: getPassDirection(riseAz, setAz),
              magnitude,
              brightness,
              duration,
            });
          }
        }

        // Reset for next pass
        passStart = null;
        maxElTime = null;
        maxEl = 0;
        wasSunlit = false;
      }
    }

    // Advance time
    currentTime = new Date(currentTime.getTime() + timeStep * 1000);
  }

  // Return only requested count
  return passes.slice(0, count);
}

/**
 * Filter passes to only those that are visible (satellite is sunlit, observer is in darkness)
 */
export function filterVisiblePasses(
  passes: SatellitePass[],
  observer: ObserverLocation
): SatellitePass[] {
  return passes.filter((pass) => {
    // Check if it's dark at the observer's location during the pass
    const isDark = isObserverInDarkness(observer, pass.maxElevationTime);
    // Check brightness (magnitude)
    const isBright = pass.magnitude < 4; // Visible to naked eye

    return isDark && isBright;
  });
}

/**
 * Check if observer location is in darkness (after sunset/before sunrise)
 */
function isObserverInDarkness(
  observer: ObserverLocation,
  time: Date
): boolean {
  // Simplified check: use civil twilight (-6 degrees)
  const dayOfYear = getDayOfYear(time);

  // Solar declination (simplified)
  const solarDeclination =
    23.45 * Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81));

  // Hour angle at sunset (approximate)
  const latRad = (observer.latitude * Math.PI) / 180;
  const decRad = (solarDeclination * Math.PI) / 180;

  // Civil twilight hour angle
  const twilightAngle = -6;
  const twilightRad = (twilightAngle * Math.PI) / 180;

  const cosHourAngle =
    (Math.sin(twilightRad) - Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad));

  // Clamp to valid range
  const clampedCos = Math.max(-1, Math.min(1, cosHourAngle));
  const hourAngle = Math.acos(clampedCos);

  // Convert to hours
  const twilightHours = (hourAngle * 180) / Math.PI / 15;

  // Solar noon in UTC (approximate)
  const solarNoon = 12 - observer.longitude / 15;

  const eveningTwilight = solarNoon + twilightHours;
  const morningTwilight = solarNoon - twilightHours;

  const utcHour = time.getUTCHours() + time.getUTCMinutes() / 60;

  // It's dark if before morning twilight or after evening twilight
  return utcHour < morningTwilight || utcHour > eveningTwilight;
}

/**
 * Normalize azimuth to 0-360 range
 */
function normalizeAzimuth(azimuth: number): number {
  return azimuth < 0 ? azimuth + 360 : azimuth;
}

/**
 * Get pass direction description based on rise and set azimuths
 */
function getPassDirection(riseAz: number, setAz: number): string {
  const riseDir = azimuthToCardinal(riseAz);
  const setDir = azimuthToCardinal(setAz);
  return `${riseDir} to ${setDir}`;
}

/**
 * Convert azimuth to cardinal direction
 */
export function azimuthToCardinal(azimuth: number): string {
  const directions = [
    "N", "NNE", "NE", "ENE",
    "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW",
    "W", "WNW", "NW", "NNW",
  ];
  const index = Math.round(azimuth / 22.5) % 16;
  return directions[index];
}

/**
 * Estimate visual magnitude based on satellite and elevation
 * This is a rough estimate - actual magnitude depends on many factors
 */
function estimateMagnitude(tle: TLEData, elevation: number): number {
  // ISS is typically around -3.5 magnitude at high elevation
  // Other satellites are typically dimmer

  const isISS = tle.noradId === 25544;
  const isCSS = tle.noradId === 48274;

  let baseMagnitude: number;

  if (isISS) {
    baseMagnitude = -3.5;
  } else if (isCSS) {
    baseMagnitude = -2.0;
  } else {
    // Default for unknown satellites
    baseMagnitude = 2.0;
  }

  // Adjust for elevation (lower elevation = dimmer due to atmosphere)
  const elevationFactor = elevation < 30 ? (30 - elevation) * 0.05 : 0;

  return baseMagnitude + elevationFactor;
}

/**
 * Get brightness category from magnitude
 */
function getBrightnessCategory(
  magnitude: number
): SatellitePass["brightness"] {
  if (magnitude <= -2) return "bright";
  if (magnitude <= 1) return "visible";
  if (magnitude <= 4) return "dim";
  return "invisible";
}

/**
 * Get day of year
 */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Format pass for display
 */
export function formatPass(pass: SatellitePass): {
  time: string;
  duration: string;
  maxElevation: string;
  direction: string;
  brightness: string;
} {
  const timeStr = pass.startTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const durationMin = Math.round(pass.duration / 60);

  return {
    time: timeStr,
    duration: `${durationMin} min`,
    maxElevation: `${Math.round(pass.maxElevation)}°`,
    direction: pass.direction,
    brightness:
      pass.brightness.charAt(0).toUpperCase() + pass.brightness.slice(1),
  };
}

/**
 * Get next visible pass
 */
export function getNextVisiblePass(
  tle: TLEData,
  observer: ObserverLocation,
  hoursAhead: number = 72
): SatellitePass | null {
  const passes = calculatePasses(tle, observer, {
    count: 10,
    minElevation: 15,
    hoursAhead,
    visibleOnly: true,
  });

  return passes.length > 0 ? passes[0] : null;
}
