/**
 * Astronomy calculations and utilities
 * 
 * Provides functions for:
 * - Moon phase and illumination calculations
 * - Sun/moon rise/set times
 * - Visibility scoring for celestial objects
 * - Optimal observation window calculations
 */

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
 * Calculate current moon phase
 * Based on astronomical algorithms
 */
export function calculateMoonPhase(date: Date = new Date()): MoonPhase {
  // Julian date calculation
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;
  
  let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + 
           Math.floor(y / 4) - Math.floor(y / 100) + 
           Math.floor(y / 400) - 32045;
  
  // Days since known new moon (Jan 6, 2000)
  const daysSinceNew = jd - 2451550.1;
  const newMoons = daysSinceNew / 29.53058867; // Synodic month
  const phase = newMoons % 1;
  
  // Calculate illumination (0-100%)
  const illumination = (1 - Math.cos(phase * 2 * Math.PI)) * 50;
  
  // Moon age in days
  const age = phase * 29.53058867;
  
  // Phase name
  let name: string;
  if (phase < 0.033 || phase > 0.967) name = "New Moon";
  else if (phase < 0.216) name = "Waxing Crescent";
  else if (phase < 0.284) name = "First Quarter";
  else if (phase < 0.466) name = "Waxing Gibbous";
  else if (phase < 0.534) name = "Full Moon";
  else if (phase < 0.716) name = "Waning Gibbous";
  else if (phase < 0.784) name = "Last Quarter";
  else name = "Waning Crescent";
  
  return {
    phase,
    illumination: Math.round(illumination * 10) / 10,
    age: Math.round(age * 10) / 10,
    name
  };
}

/**
 * Calculate sun and moon rise/set times
 * Simplified calculation - for production, use a library like suncalc
 */
export function calculateSunMoonTimes(
  lat: number,
  lng: number,
  date: Date = new Date()
): SunMoonTimes {
  // This is a simplified implementation
  // For production, use: npm install suncalc
  // import SunCalc from 'suncalc';
  
  // Placeholder implementation
  const now = new Date(date);
  now.setHours(0, 0, 0, 0);
  
  return {
    sunrise: new Date(now.getTime() + 6.5 * 3600000),
    sunset: new Date(now.getTime() + 18 * 3600000),
    civilDusk: new Date(now.getTime() + 18.5 * 3600000),
    nauticalDusk: new Date(now.getTime() + 19 * 3600000),
    astronomicalDusk: new Date(now.getTime() + 19.5 * 3600000),
    civilDawn: new Date(now.getTime() + 6 * 3600000),
    nauticalDawn: new Date(now.getTime() + 5.5 * 3600000),
    astronomicalDawn: new Date(now.getTime() + 5 * 3600000),
    moonrise: new Date(now.getTime() + 19 * 3600000),
    moonset: new Date(now.getTime() + 7 * 3600000)
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
 * Calculate optimal observation window for tonight
 */
export function calculateOptimalWindow(
  lat: number,
  lng: number,
  date: Date = new Date()
): { start: Date; end: Date; quality: number } {
  const times = calculateSunMoonTimes(lat, lng, date);
  const moonPhase = calculateMoonPhase(date);
  
  // Optimal window is between astronomical dusk and dawn
  // Quality depends on moon phase
  const moonQuality = 100 - (moonPhase.illumination * 0.8);
  
  return {
    start: times.astronomicalDusk,
    end: times.astronomicalDawn,
    quality: Math.round(moonQuality)
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
