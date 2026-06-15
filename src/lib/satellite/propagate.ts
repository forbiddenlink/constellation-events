/**
 * Satellite position propagation using satellite.js
 *
 * Uses SGP4/SDP4 propagation models to calculate satellite positions
 * from TLE orbital elements.
 */

import * as satellite from "satellite.js";
import type {
  TLEData,
  SatellitePosition,
  GroundTrackPoint,
  ObserverLocation,
} from "./types";

/**
 * Calculate satellite position at a given time
 */
export function propagatePosition(
  tle: TLEData,
  time: Date = new Date()
): SatellitePosition | null {
  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const positionAndVelocity = satellite.propagate(satrec, time);

    if (
      !positionAndVelocity ||
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

    // Calculate ground footprint radius
    const earthRadius = 6371; // km
    const footprint = Math.sqrt(2 * earthRadius * altitude + altitude ** 2);

    return {
      latitude,
      longitude,
      altitude,
      velocity: velocityMagnitude * 3600, // km/s to km/h
      timestamp: time,
      footprint,
    };
  } catch (error) {
    console.warn("[satellite/propagate] Position calculation failed:", {
      satellite: tle.name,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Calculate satellite position relative to an observer
 */
export function propagatePositionForObserver(
  tle: TLEData,
  observer: ObserverLocation,
  time: Date = new Date()
): SatellitePosition | null {
  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const positionAndVelocity = satellite.propagate(satrec, time);

    if (
      !positionAndVelocity ||
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

    // Observer position in geodetic coordinates
    const observerGd = {
      longitude: satellite.degreesToRadians(observer.longitude),
      latitude: satellite.degreesToRadians(observer.latitude),
      height: (observer.altitude ?? 0) / 1000, // Convert m to km
    };

    // Convert ECI to ECF
    const positionEcf = satellite.eciToEcf(positionEci, gmst);

    // Calculate look angles from observer to satellite
    const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);

    const latitude = satellite.degreesLat(positionGd.latitude);
    const longitude = satellite.degreesLong(positionGd.longitude);
    const altitude = positionGd.height;

    // Calculate velocity magnitude
    const velocityMagnitude = Math.sqrt(
      velocityEci.x ** 2 + velocityEci.y ** 2 + velocityEci.z ** 2
    );

    // Calculate ground footprint radius
    const earthRadius = 6371;
    const footprint = Math.sqrt(2 * earthRadius * altitude + altitude ** 2);

    return {
      latitude,
      longitude,
      altitude,
      velocity: velocityMagnitude * 3600,
      timestamp: time,
      azimuth: satellite.radiansToDegrees(lookAngles.azimuth),
      elevation: satellite.radiansToDegrees(lookAngles.elevation),
      range: lookAngles.rangeSat,
      footprint,
    };
  } catch (error) {
    console.warn("[satellite/propagate] Observer calculation failed:", {
      satellite: tle.name,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Generate ground track for a satellite over a time period
 */
export function generateGroundTrack(
  tle: TLEData,
  durationMinutes: number = 90,
  intervalSeconds: number = 60,
  startTime: Date = new Date()
): GroundTrackPoint[] {
  const track: GroundTrackPoint[] = [];
  const steps = Math.floor((durationMinutes * 60) / intervalSeconds);

  for (let i = 0; i <= steps; i++) {
    const time = new Date(startTime.getTime() + i * intervalSeconds * 1000);
    const position = propagatePosition(tle, time);

    if (position) {
      track.push({
        lat: position.latitude,
        lng: position.longitude,
        time,
        altitude: position.altitude,
      });
    }
  }

  return track;
}

/**
 * Check if satellite is currently sunlit (visible at night)
 * Simplified calculation based on satellite altitude and solar position
 */
export function isSatelliteSunlit(
  satellitePosition: SatellitePosition,
  time: Date = new Date()
): boolean {
  // Earth's shadow extends approximately 1.4 million km
  // For LEO satellites (~400km), they exit shadow at ~90 degrees from subsolar point

  // Calculate solar declination (simplified)
  const dayOfYear = getDayOfYear(time);
  const solarDeclination = 23.45 * Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81));

  // Get current UTC hour as fraction
  const utcHour = time.getUTCHours() + time.getUTCMinutes() / 60;

  // Calculate subsolar longitude (approximate)
  const subsolarLongitude = -15 * (utcHour - 12);

  // Calculate angular distance from subsolar point
  const latDiff = Math.abs(satellitePosition.latitude - solarDeclination);
  const lonDiff = Math.abs(satellitePosition.longitude - subsolarLongitude);

  // Normalize longitude difference
  const normalizedLonDiff = lonDiff > 180 ? 360 - lonDiff : lonDiff;

  // Simplified: satellite is sunlit if within ~90 degrees of subsolar point
  // adjusted for altitude (higher satellites have wider illumination angle)
  const altitudeFactor = 1 + satellitePosition.altitude / 6371; // Earth radii
  const shadowAngle = 90 * altitudeFactor;

  const angularDistance = Math.sqrt(latDiff ** 2 + normalizedLonDiff ** 2);

  return angularDistance < shadowAngle;
}

/**
 * Get day of year (1-366)
 */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Calculate orbital period from TLE
 */
export function getOrbitalPeriod(tle: TLEData): number {
  // Mean motion is in revolutions per day (field in line 2)
  const meanMotion = parseFloat(tle.line2.substring(52, 63).trim());
  // Convert to minutes per orbit
  return (24 * 60) / meanMotion;
}

/**
 * Get satellite epoch from TLE
 */
export function getTLEEpoch(tle: TLEData): Date {
  // Epoch year (positions 18-19 in line 1)
  const epochYear = parseInt(tle.line1.substring(18, 20), 10);
  // Epoch day (positions 20-32 in line 1)
  const epochDay = parseFloat(tle.line1.substring(20, 32));

  // Convert 2-digit year to 4-digit
  const fullYear = epochYear < 57 ? 2000 + epochYear : 1900 + epochYear;

  // Convert day of year to date
  const date = new Date(fullYear, 0, 1);
  date.setDate(epochDay);

  // Add fractional day as milliseconds
  const fractionalDay = epochDay % 1;
  date.setTime(date.getTime() + fractionalDay * 24 * 60 * 60 * 1000);

  return date;
}
