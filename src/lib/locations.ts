/**
 * Dark-sky location utilities
 * 
 * Functions for finding and scoring observation locations
 */

import type { Coordinates } from "./geo";
import { calculateBortleClass, calculateOptimalWindow } from "./astronomy";

export type DarkSkyLocation = {
  id: string;
  name: string;
  coordinates: Coordinates;
  distance: number; // km from user
  distanceDisplay: string; // "42 mi" or "68 km"
  darkSkyScore: number; // 0-100
  bortleClass: number; // 1-9
  elevation: number; // meters
  description: string;
  amenities: string[];
  bestWindow: string;
  accessibility: "easy" | "moderate" | "difficult";
  type: "park" | "reserve" | "wilderness" | "private" | "other";
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const toRad = (deg: number) => deg * Math.PI / 180;
  
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance for display
 */
export function formatDistance(km: number, useMetric: boolean = false): string {
  if (useMetric) {
    return km < 1 ? `${Math.round(km * 1000)} m` : `${Math.round(km)} km`;
  }
  const miles = km * 0.621371;
  return `${Math.round(miles)} mi`;
}

/**
 * Known dark-sky locations database
 * In production, this would be a real database or API
 */
const KNOWN_DARK_SKY_LOCATIONS: Omit<DarkSkyLocation, 'distance' | 'distanceDisplay' | 'bestWindow'>[] = [
  {
    id: "great-basin-nv",
    name: "Great Basin National Park",
    coordinates: { lat: 38.98, lng: -114.22 },
    darkSkyScore: 95,
    bortleClass: 2,
    elevation: 2000,
    description: "IDA certified International Dark Sky Park with exceptional visibility",
    amenities: ["Parking", "Restrooms", "Camping", "Visitor Center"],
    accessibility: "easy",
    type: "park"
  },
  {
    id: "death-valley-ca",
    name: "Death Valley National Park",
    coordinates: { lat: 36.86, lng: -117.13 },
    darkSkyScore: 93,
    bortleClass: 2,
    elevation: -86,
    description: "Vast dark sky preserve with minimal light pollution",
    amenities: ["Parking", "Camping", "Limited Services"],
    accessibility: "easy",
    type: "park"
  },
  {
    id: "joshua-tree-ca",
    name: "Joshua Tree National Park",
    coordinates: { lat: 33.87, lng: -115.90 },
    darkSkyScore: 88,
    bortleClass: 3,
    elevation: 1200,
    description: "Popular stargazing destination with unique desert landscape",
    amenities: ["Parking", "Restrooms", "Camping", "Ranger Programs"],
    accessibility: "easy",
    type: "park"
  },
  {
    id: "red-rock-nv",
    name: "Red Rock Canyon",
    coordinates: { lat: 36.13, lng: -115.43 },
    darkSkyScore: 72,
    bortleClass: 4,
    elevation: 1000,
    description: "Accessible dark-sky site near Las Vegas",
    amenities: ["Parking", "Restrooms", "Scenic Route"],
    accessibility: "easy",
    type: "reserve"
  },
  {
    id: "valley-fire-nv",
    name: "Valley of Fire State Park",
    coordinates: { lat: 36.49, lng: -114.53 },
    darkSkyScore: 85,
    bortleClass: 3,
    elevation: 650,
    description: "Stunning red rock formations with good dark skies",
    amenities: ["Parking", "Camping", "Restrooms", "Visitor Center"],
    accessibility: "easy",
    type: "park"
  }
];

/**
 * Find dark-sky locations near user coordinates
 */
export function findNearbyDarkSkyLocations(
  userCoords: Coordinates,
  maxDistance: number = 200, // km
  limit: number = 10
): DarkSkyLocation[] {
  const locations = KNOWN_DARK_SKY_LOCATIONS
    .map(loc => {
      const distance = calculateDistance(userCoords, loc.coordinates);
      const window = calculateOptimalWindow(loc.coordinates.lat, loc.coordinates.lng);
      
      return {
        ...loc,
        distance,
        distanceDisplay: formatDistance(distance),
        bestWindow: `${window.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${window.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
      };
    })
    .filter(loc => loc.distance <= maxDistance)
    .sort((a, b) => {
      // Sort by a combination of distance and quality
      const scoreA = a.darkSkyScore - (a.distance * 0.2);
      const scoreB = b.darkSkyScore - (b.distance * 0.2);
      return scoreB - scoreA;
    })
    .slice(0, limit);

  return locations;
}

/**
 * Calculate dark-sky score from coordinates
 * In production, this would query light pollution data (VIIRS tiles)
 */
export function estimateDarkSkyScore(coords: Coordinates): number {
  // Simplified estimation based on known population centers
  // In production, query actual light pollution raster data
  
  // Distance from major cities affects score
  const lasVegas = { lat: 36.1699, lng: -115.1398 };
  const losAngeles = { lat: 34.0522, lng: -118.2437 };
  const phoenix = { lat: 33.4484, lng: -112.0740 };
  
  const distances = [
    calculateDistance(coords, lasVegas),
    calculateDistance(coords, losAngeles),
    calculateDistance(coords, phoenix)
  ];
  
  const minDistance = Math.min(...distances);
  
  // Score decreases rapidly near cities
  let score = 100;
  if (minDistance < 10) score = 35;
  else if (minDistance < 20) score = 50;
  else if (minDistance < 40) score = 65;
  else if (minDistance < 80) score = 80;
  else if (minDistance < 150) score = 90;
  
  return Math.round(score);
}

/**
 * Generate location recommendations based on criteria
 */
export function recommendLocations(
  userCoords: Coordinates,
  criteria: {
    maxDistance?: number;
    minQuality?: number;
    accessibility?: DarkSkyLocation["accessibility"][];
    amenities?: string[];
  } = {}
): DarkSkyLocation[] {
  const {
    maxDistance = 150,
    minQuality = 70,
    accessibility,
    amenities
  } = criteria;
  
  let locations = findNearbyDarkSkyLocations(userCoords, maxDistance, 50);
  
  // Filter by quality
  locations = locations.filter(loc => loc.darkSkyScore >= minQuality);
  
  // Filter by accessibility
  if (accessibility && accessibility.length > 0) {
    locations = locations.filter(loc => accessibility.includes(loc.accessibility));
  }
  
  // Filter by amenities
  if (amenities && amenities.length > 0) {
    locations = locations.filter(loc => 
      amenities.some(amenity => loc.amenities.includes(amenity))
    );
  }
  
  return locations;
}

/**
 * Get location details with live conditions
 */
export async function getLocationDetails(
  locationId: string,
  currentConditions?: {
    cloudCover?: number;
    seeing?: string;
  }
): Promise<DarkSkyLocation | null> {
  const location = KNOWN_DARK_SKY_LOCATIONS.find(loc => loc.id === locationId);
  if (!location) return null;
  
  // Calculate distance from a reference point (would be user's location in practice)
  const distance = 0; // Placeholder
  
  return {
    ...location,
    distance,
    distanceDisplay: formatDistance(distance),
    bestWindow: "Calculating..."
  };
}
