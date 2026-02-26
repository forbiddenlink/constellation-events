/**
 * Astronomy calculations and utilities
 *
 * Provides functions for:
 * - Moon phase and illumination calculations
 * - Sun/moon rise/set times
 * - Visibility scoring for celestial objects
 * - Optimal observation window calculations
 *
 * Uses astronomy-engine via celestial-engine.ts for accurate ephemeris calculations.
 */

import {
  getMoonInfo,
  getSunTimes,
  getMoonTimes,
  getOptimalObservationWindow,
} from "./celestial-engine";

export type MoonPhase = {
  phase: number; // 0-1 (0=new, 0.25=first quarter, 0.5=full, 0.75=last quarter)
  illumination: number; // 0-100 percentage
  age: number; // Days since new moon
  name: string; // Human-readable phase name
};

export type SunMoonTimes = {
  sunrise: Date;
  sunset: Date;
  moonrise: Date | null;
  moonset: Date | null;
  civilDusk: Date; // Sun 6° below horizon
  nauticalDusk: Date; // Sun 12° below horizon
  astronomicalDusk: Date; // Sun 18° below horizon (true darkness)
  civilDawn: Date;
  nauticalDawn: Date;
  astronomicalDawn: Date;
};

export type VisibilityScore = {
  score: number; // 0-100
  rating: "excellent" | "good" | "fair" | "poor";
  factors: {
    moonInterference: number; // 0-100 (higher is better)
    altitude: number; // 0-100
    atmosphericConditions: number; // 0-100
    lightPollution: number; // 0-100
  };
};

/**
 * Calculate current moon phase using astronomy-engine
 * Provides accurate ephemeris-based calculations
 */
export function calculateMoonPhase(
  date: Date = new Date(),
  lat = 0,
  lon = 0
): MoonPhase {
  const moonInfo = getMoonInfo(lat, lon, date);

  return {
    phase: moonInfo.phase,
    illumination: moonInfo.illumination,
    age: moonInfo.age,
    name: moonInfo.name,
  };
}

/**
 * Calculate sun and moon rise/set times using astronomy-engine
 * Provides accurate location-aware calculations
 */
export function calculateSunMoonTimes(
  lat: number,
  lng: number,
  date: Date = new Date()
): SunMoonTimes {
  const sunTimes = getSunTimes(lat, lng, date);
  const moonTimes = getMoonTimes(lat, lng, date);

  // Fallback times for polar regions or calculation failures
  const now = new Date(date);
  now.setHours(0, 0, 0, 0);
  const fallbackSunrise = new Date(now.getTime() + 6.5 * 3600000);
  const fallbackSunset = new Date(now.getTime() + 18 * 3600000);

  return {
    sunrise: sunTimes.sunrise ?? fallbackSunrise,
    sunset: sunTimes.sunset ?? fallbackSunset,
    civilDusk: sunTimes.civilDusk ?? new Date(now.getTime() + 18.5 * 3600000),
    nauticalDusk:
      sunTimes.nauticalDusk ?? new Date(now.getTime() + 19 * 3600000),
    astronomicalDusk:
      sunTimes.astronomicalDusk ?? new Date(now.getTime() + 19.5 * 3600000),
    civilDawn: sunTimes.civilDawn ?? new Date(now.getTime() + 6 * 3600000),
    nauticalDawn:
      sunTimes.nauticalDawn ?? new Date(now.getTime() + 5.5 * 3600000),
    astronomicalDawn:
      sunTimes.astronomicalDawn ?? new Date(now.getTime() + 5 * 3600000),
    moonrise: moonTimes.moonrise,
    moonset: moonTimes.moonset,
  };
}

/**
 * Calculate visibility score for celestial object
 */
export function calculateVisibilityScore(params: {
  altitude: number; // degrees above horizon
  moonPhase: number; // 0-1
  moonAltitude: number; // degrees
  angularSeparation: number; // degrees from moon
  bortleClass?: number; // 1-9 light pollution scale
  cloudCover?: number; // 0-100 percentage
  humidity?: number; // 0-100 percentage
}): VisibilityScore {
  const {
    altitude,
    moonPhase,
    moonAltitude,
    angularSeparation,
    bortleClass = 5,
    cloudCover = 0,
    humidity = 50
  } = params;
  
  // Altitude factor (0-100)
  // Best above 30°, poor below 15°
  const altitudeFactor = Math.max(0, Math.min(100, 
    altitude < 15 ? altitude * 3 : 
    altitude < 30 ? 45 + (altitude - 15) * 2 :
    70 + (altitude - 30) * 0.5
  ));
  
  // Moon interference (0-100, higher is better)
  const moonIllumination = moonPhase < 0.5 ? moonPhase * 2 : (1 - moonPhase) * 2;
  let moonInterference = 100;
  
  if (moonAltitude > 0) {
    // Moon is above horizon
    const moonBrightness = moonIllumination * 100;
    const separationFactor = Math.min(100, angularSeparation / 90 * 100);
    moonInterference = 100 - (moonBrightness * (100 - separationFactor) / 100);
  }
  
  // Light pollution factor (Bortle scale inverted)
  const lightPollution = Math.max(0, 100 - (bortleClass - 1) * 12.5);
  
  // Atmospheric conditions
  const atmosphericConditions = Math.max(0, 
    100 - cloudCover - (humidity > 70 ? (humidity - 70) * 0.5 : 0)
  );
  
  // Overall score (weighted average)
  const score = (
    altitudeFactor * 0.3 +
    moonInterference * 0.25 +
    atmosphericConditions * 0.25 +
    lightPollution * 0.2
  );
  
  // Rating
  let rating: VisibilityScore["rating"];
  if (score >= 80) rating = "excellent";
  else if (score >= 60) rating = "good";
  else if (score >= 40) rating = "fair";
  else rating = "poor";
  
  return {
    score: Math.round(score),
    rating,
    factors: {
      moonInterference: Math.round(moonInterference),
      altitude: Math.round(altitudeFactor),
      atmosphericConditions: Math.round(atmosphericConditions),
      lightPollution: Math.round(lightPollution)
    }
  };
}

/**
 * Calculate optimal observation window for tonight using astronomy-engine
 */
export function calculateOptimalWindow(
  lat: number,
  lng: number,
  date: Date = new Date()
): { start: Date; end: Date; quality: number } {
  const window = getOptimalObservationWindow(lat, lng, date);

  // Fallback for polar regions or calculation failures
  if (!window.start || !window.end) {
    const times = calculateSunMoonTimes(lat, lng, date);
    return {
      start: times.astronomicalDusk,
      end: times.astronomicalDawn,
      quality: window.quality,
    };
  }

  return {
    start: window.start,
    end: window.end,
    quality: window.quality,
  };
}

/**
 * Calculate angular separation between two celestial coordinates
 */
export function angularSeparation(
  ra1: number, dec1: number,
  ra2: number, dec2: number
): number {
  // Convert to radians
  const toRad = (deg: number) => deg * Math.PI / 180;
  
  const dRa = toRad(ra2 - ra1);
  const dDec1 = toRad(dec1);
  const dDec2 = toRad(dec2);
  
  // Haversine formula
  const a = Math.sin(dDec1) * Math.sin(dDec2) + 
            Math.cos(dDec1) * Math.cos(dDec2) * Math.cos(dRa);
  
  return Math.acos(Math.max(-1, Math.min(1, a))) * 180 / Math.PI;
}

/**
 * Calculate Bortle class from light pollution value
 * Input: VIIRS radiance or similar metric
 */
export function calculateBortleClass(radiance: number): number {
  // Approximate mapping of radiance to Bortle class
  // These thresholds should be calibrated with real data
  if (radiance < 1) return 1; // Excellent dark sky
  if (radiance < 3) return 2; // Typical dark sky
  if (radiance < 10) return 3; // Rural sky
  if (radiance < 30) return 4; // Rural/suburban transition
  if (radiance < 100) return 5; // Suburban sky
  if (radiance < 300) return 6; // Bright suburban
  if (radiance < 1000) return 7; // Suburban/urban transition
  if (radiance < 3000) return 8; // City sky
  return 9; // Inner city
}

/**
 * Format time range for display
 */
export function formatTimeRange(start: Date, end: Date): string {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };
  
  return `${formatTime(start)} – ${formatTime(end)}`;
}
