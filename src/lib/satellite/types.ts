/**
 * Satellite tracking types
 */

export interface SatellitePass {
  startTime: Date;
  endTime: Date;
  maxElevation: number;
  maxElevationTime: Date;
  startAzimuth: number;
  endAzimuth: number;
  direction: string;
  magnitude: number;
  brightness: "bright" | "visible" | "dim" | "invisible";
  duration: number; // seconds
}

export interface SatellitePosition {
  latitude: number;
  longitude: number;
  altitude: number; // km
  velocity: number; // km/h
  timestamp: Date;
  azimuth?: number; // degrees from observer
  elevation?: number; // degrees from horizon
  range?: number; // km from observer
  footprint?: number; // km - visible ground radius
}

export interface TLEData {
  name: string;
  line1: string;
  line2: string;
  noradId: number;
  fetchedAt: number;
}

export interface SatelliteInfo {
  name: string;
  noradId: number;
  intlDesignator: string;
  launchDate?: Date;
  decayDate?: Date | null;
  type: "payload" | "debris" | "rocket-body" | "unknown";
  country?: string;
}

export interface GroundTrackPoint {
  lat: number;
  lng: number;
  time: Date;
  altitude: number;
}

export interface ObserverLocation {
  latitude: number;
  longitude: number;
  altitude?: number; // meters above sea level
}

export interface PassPredictionOptions {
  count?: number;
  minElevation?: number;
  hoursAhead?: number;
  visibleOnly?: boolean;
}

export interface SatelliteCatalogEntry {
  name: string;
  noradId: number;
  category: "stations" | "weather" | "starlink" | "amateur" | "science" | "other";
  description?: string;
  magnitude?: number; // typical visual magnitude
}

// Popular satellites for tracking
export const POPULAR_SATELLITES: SatelliteCatalogEntry[] = [
  { name: "ISS (ZARYA)", noradId: 25544, category: "stations", magnitude: -3.5, description: "International Space Station" },
  { name: "CSS (TIANHE)", noradId: 48274, category: "stations", magnitude: -2.0, description: "China Space Station" },
  { name: "TIANGONG", noradId: 59835, category: "stations", magnitude: -1.5, description: "Chinese Space Station module" },
  { name: "HST", noradId: 20580, category: "science", magnitude: 1.5, description: "Hubble Space Telescope" },
  { name: "TERRA", noradId: 25994, category: "science", magnitude: 2.5, description: "Earth observation satellite" },
  { name: "AQUA", noradId: 27424, category: "science", magnitude: 3.0, description: "Earth observation satellite" },
];
