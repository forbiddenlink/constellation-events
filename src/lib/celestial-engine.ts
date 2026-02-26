/**
 * Celestial Engine - Real astronomy calculations using astronomy-engine
 *
 * Provides accurate ephemeris calculations for:
 * - Planet positions (altitude, azimuth, distance)
 * - Moon phase and illumination
 * - Sun/moon rise/set times
 * - Visibility predictions
 */

import * as Astronomy from "astronomy-engine";

export interface CelestialBody {
  name: string;
  body: Astronomy.Body;
  symbol: string;
}

export const PLANETS: CelestialBody[] = [
  { name: "Mercury", body: Astronomy.Body.Mercury, symbol: "☿" },
  { name: "Venus", body: Astronomy.Body.Venus, symbol: "♀" },
  { name: "Mars", body: Astronomy.Body.Mars, symbol: "♂" },
  { name: "Jupiter", body: Astronomy.Body.Jupiter, symbol: "♃" },
  { name: "Saturn", body: Astronomy.Body.Saturn, symbol: "♄" },
  { name: "Uranus", body: Astronomy.Body.Uranus, symbol: "♅" },
  { name: "Neptune", body: Astronomy.Body.Neptune, symbol: "♆" }
];

export interface HorizonPosition {
  altitude: number; // degrees above horizon
  azimuth: number; // degrees clockwise from north
  distance: number; // AU
  isVisible: boolean;
}

export interface MoonInfo {
  phase: number; // 0-1 (0=new, 0.5=full)
  illumination: number; // 0-100%
  age: number; // days since new moon
  name: string; // Human-readable phase name
  altitude: number;
  azimuth: number;
  distance: number; // km
}

export interface SunTimes {
  sunrise: Date | null;
  sunset: Date | null;
  civilDawn: Date | null;
  civilDusk: Date | null;
  nauticalDawn: Date | null;
  nauticalDusk: Date | null;
  astronomicalDawn: Date | null;
  astronomicalDusk: Date | null;
}

export interface MoonTimes {
  moonrise: Date | null;
  moonset: Date | null;
}

/**
 * Create an observer for a given location
 */
function createObserver(lat: number, lon: number, elevation = 0): Astronomy.Observer {
  return new Astronomy.Observer(lat, lon, elevation);
}

/**
 * Get current position of a celestial body in horizontal coordinates
 */
export function getBodyPosition(
  body: Astronomy.Body,
  lat: number,
  lon: number,
  date: Date = new Date()
): HorizonPosition {
  const observer = createObserver(lat, lon);
  const time = Astronomy.MakeTime(date);

  // Get equatorial coordinates
  const equatorial = Astronomy.Equator(body, time, observer, true, true);

  // Convert to horizontal coordinates
  const horizontal = Astronomy.Horizon(time, observer, equatorial.ra, equatorial.dec, "normal");

  return {
    altitude: horizontal.altitude,
    azimuth: horizontal.azimuth,
    distance: equatorial.dist,
    isVisible: horizontal.altitude > 0
  };
}

/**
 * Get positions of all planets
 */
export function getAllPlanetPositions(
  lat: number,
  lon: number,
  date: Date = new Date()
): Array<CelestialBody & HorizonPosition> {
  return PLANETS.map((planet) => ({
    ...planet,
    ...getBodyPosition(planet.body, lat, lon, date)
  }));
}

/**
 * Get visible planets (above horizon)
 */
export function getVisiblePlanets(
  lat: number,
  lon: number,
  date: Date = new Date()
): Array<CelestialBody & HorizonPosition> {
  return getAllPlanetPositions(lat, lon, date).filter((p) => p.isVisible);
}

/**
 * Calculate accurate moon phase and position
 */
export function getMoonInfo(lat: number, lon: number, date: Date = new Date()): MoonInfo {
  const time = Astronomy.MakeTime(date);
  const observer = createObserver(lat, lon);

  // Get moon phase (0-360 degrees, where 0=new, 180=full)
  const phaseAngle = Astronomy.MoonPhase(time);
  const phase = phaseAngle / 360; // Convert to 0-1

  // Calculate illumination
  const illumination = ((1 - Math.cos((phase * 2 * Math.PI))) / 2) * 100;

  // Moon age in days (synodic month = 29.53 days)
  const age = phase * 29.53;

  // Get phase name
  let name: string;
  if (phase < 0.033 || phase > 0.967) name = "New Moon";
  else if (phase < 0.216) name = "Waxing Crescent";
  else if (phase < 0.284) name = "First Quarter";
  else if (phase < 0.466) name = "Waxing Gibbous";
  else if (phase < 0.534) name = "Full Moon";
  else if (phase < 0.716) name = "Waning Gibbous";
  else if (phase < 0.784) name = "Last Quarter";
  else name = "Waning Crescent";

  // Get moon position
  const moonPos = getBodyPosition(Astronomy.Body.Moon, lat, lon, date);

  // Get moon distance in km
  const moonDistance = Astronomy.Libration(time);

  return {
    phase,
    illumination: Math.round(illumination * 10) / 10,
    age: Math.round(age * 10) / 10,
    name,
    altitude: moonPos.altitude,
    azimuth: moonPos.azimuth,
    distance: Math.round(moonDistance.dist_km)
  };
}

// Direction constants: +1 = rise (ascending), -1 = set (descending)
const DIRECTION_RISE = 1;
const DIRECTION_SET = -1;

/**
 * Calculate sun rise/set and twilight times
 */
export function getSunTimes(lat: number, lon: number, date: Date = new Date()): SunTimes {
  const observer = createObserver(lat, lon);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const time = Astronomy.MakeTime(startOfDay);

  const searchWindow = 1; // Search within 1 day

  // Helper to safely search for rise/set times
  const searchRiseSet = (
    direction: number,
    altitude: number
  ): Date | null => {
    try {
      const result = Astronomy.SearchAltitude(
        Astronomy.Body.Sun,
        observer,
        direction,
        time,
        searchWindow,
        altitude
      );
      return result?.date || null;
    } catch {
      return null;
    }
  };

  return {
    sunrise: searchRiseSet(DIRECTION_RISE, -0.833), // Standard refraction
    sunset: searchRiseSet(DIRECTION_SET, -0.833),
    civilDawn: searchRiseSet(DIRECTION_RISE, -6),
    civilDusk: searchRiseSet(DIRECTION_SET, -6),
    nauticalDawn: searchRiseSet(DIRECTION_RISE, -12),
    nauticalDusk: searchRiseSet(DIRECTION_SET, -12),
    astronomicalDawn: searchRiseSet(DIRECTION_RISE, -18),
    astronomicalDusk: searchRiseSet(DIRECTION_SET, -18)
  };
}

/**
 * Calculate moon rise/set times
 */
export function getMoonTimes(lat: number, lon: number, date: Date = new Date()): MoonTimes {
  const observer = createObserver(lat, lon);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const time = Astronomy.MakeTime(startOfDay);

  const searchWindow = 1; // Search within 1 day

  const searchRiseSet = (direction: number): Date | null => {
    try {
      const result = Astronomy.SearchAltitude(
        Astronomy.Body.Moon,
        observer,
        direction,
        time,
        searchWindow,
        -0.833
      );
      return result?.date || null;
    } catch {
      return null;
    }
  };

  return {
    moonrise: searchRiseSet(DIRECTION_RISE),
    moonset: searchRiseSet(DIRECTION_SET)
  };
}

/**
 * Get the optimal observation window for tonight
 */
export function getOptimalObservationWindow(
  lat: number,
  lon: number,
  date: Date = new Date()
): {
  start: Date | null;
  end: Date | null;
  quality: number;
  moonInterference: string;
} {
  const sunTimes = getSunTimes(lat, lon, date);
  const moonInfo = getMoonInfo(lat, lon, date);

  // Quality based on moon phase (new moon = 100%, full = 20%)
  const moonQuality = 100 - moonInfo.illumination * 0.8;

  // Determine moon interference level
  let moonInterference: string;
  if (moonInfo.illumination < 25) moonInterference = "minimal";
  else if (moonInfo.illumination < 50) moonInterference = "low";
  else if (moonInfo.illumination < 75) moonInterference = "moderate";
  else moonInterference = "high";

  return {
    start: sunTimes.astronomicalDusk,
    end: sunTimes.astronomicalDawn,
    quality: Math.round(moonQuality),
    moonInterference
  };
}

/**
 * Find next conjunction between two bodies
 */
export function findNextConjunction(
  body1: Astronomy.Body,
  body2: Astronomy.Body,
  startDate: Date = new Date()
): { date: Date; separation: number } | null {
  try {
    const time = Astronomy.MakeTime(startDate);
    const result = Astronomy.SearchRelativeLongitude(body1, 0, time);

    if (result) {
      // Calculate angular separation at conjunction using geocentric vectors
      const geo1 = Astronomy.GeoVector(body1, result, true);
      const geo2 = Astronomy.GeoVector(body2, result, true);
      const separation = Astronomy.AngleBetween(geo1, geo2);

      return {
        date: result.date,
        separation
      };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Calculate when a body will next rise above a given altitude
 */
export function findNextRise(
  body: Astronomy.Body,
  lat: number,
  lon: number,
  minAltitude = 0,
  startDate: Date = new Date()
): Date | null {
  const observer = createObserver(lat, lon);
  const time = Astronomy.MakeTime(startDate);

  try {
    const result = Astronomy.SearchAltitude(
      body,
      observer,
      DIRECTION_RISE,
      time,
      7, // Search up to 7 days
      minAltitude
    );
    return result?.date || null;
  } catch {
    return null;
  }
}

/**
 * Get season information for a date
 */
export function getSeasonInfo(date: Date = new Date()): {
  current: string;
  nextEquinoxOrSolstice: { name: string; date: Date };
} {
  const year = date.getFullYear();
  const seasons = Astronomy.Seasons(year);

  const events = [
    { name: "March Equinox", date: seasons.mar_equinox.date },
    { name: "June Solstice", date: seasons.jun_solstice.date },
    { name: "September Equinox", date: seasons.sep_equinox.date },
    { name: "December Solstice", date: seasons.dec_solstice.date }
  ];

  // Determine current season (Northern Hemisphere)
  let current: string;
  const month = date.getMonth();
  if (month >= 2 && month < 5) current = "Spring";
  else if (month >= 5 && month < 8) current = "Summer";
  else if (month >= 8 && month < 11) current = "Fall";
  else current = "Winter";

  // Find next event
  const nextEvent =
    events.find((e) => e.date > date) ||
    // If none found this year, get first event of next year
    { name: "March Equinox", date: Astronomy.Seasons(year + 1).mar_equinox.date };

  return {
    current,
    nextEquinoxOrSolstice: nextEvent
  };
}
