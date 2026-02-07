/**
 * Real astronomy event generator
 * 
 * Generates upcoming celestial events including:
 * - Moon phases
 * - Meteor showers
 * - Planetary conjunctions
 * - Solar system events
 */

import { calculateMoonPhase, calculateVisibilityScore, formatTimeRange } from "./astronomy";
import type { Coordinates } from "./geo";

export type AstronomyEvent = {
  id: string;
  title: string;
  date: string; // ISO date
  dateDisplay: string; // Human-readable
  window: string; // Time range
  visibility: "excellent" | "good" | "fair" | "poor";
  visibilityScore: number;
  summary: string;
  type: "moon" | "meteor" | "planet" | "eclipse" | "conjunction" | "other";
  peak?: string; // Peak time for meteor showers, etc.
};

/**
 * Known meteor showers with their peak dates (2026)
 */
const METEOR_SHOWERS_2026 = [
  { name: "Quadrantids", peak: new Date("2026-01-03"), zhr: 120, active: { start: "2026-01-01", end: "2026-01-12" } },
  { name: "Lyrids", peak: new Date("2026-04-22"), zhr: 18, active: { start: "2026-04-16", end: "2026-04-25" } },
  { name: "Eta Aquariids", peak: new Date("2026-05-06"), zhr: 50, active: { start: "2026-04-19", end: "2026-05-28" } },
  { name: "Perseids", peak: new Date("2026-08-12"), zhr: 100, active: { start: "2026-07-17", end: "2026-08-24" } },
  { name: "Orionids", peak: new Date("2026-10-21"), zhr: 25, active: { start: "2026-10-02", end: "2026-11-07" } },
  { name: "Leonids", peak: new Date("2026-11-17"), zhr: 15, active: { start: "2026-11-06", end: "2026-11-30" } },
  { name: "Geminids", peak: new Date("2026-12-14"), zhr: 150, active: { start: "2026-12-04", end: "2026-12-20" } },
];

/**
 * Generate upcoming moon phase events
 */
function generateMoonEvents(fromDate: Date, toDate: Date): AstronomyEvent[] {
  const events: AstronomyEvent[] = [];
  const current = new Date(fromDate);
  
  // Check each day for significant moon phases
  while (current <= toDate) {
    const phase = calculateMoonPhase(current);
    
    // Only include major phases (New, First Quarter, Full, Last Quarter)
    let includeEvent = false;
    let title = "";
    let summary = "";
    
    if (phase.phase < 0.02 || phase.phase > 0.98) {
      includeEvent = true;
      title = "New Moon";
      summary = "Ideal for deep-sky observation. No moonlight interference.";
    } else if (Math.abs(phase.phase - 0.25) < 0.02) {
      includeEvent = true;
      title = "First Quarter Moon";
      summary = "Half-illuminated moon visible in evening sky.";
    } else if (Math.abs(phase.phase - 0.5) < 0.02) {
      includeEvent = true;
      title = "Full Moon";
      summary = "Bright moonlight affects deep-sky viewing. Great for lunar observation.";
    } else if (Math.abs(phase.phase - 0.75) < 0.02) {
      includeEvent = true;
      title = "Last Quarter Moon";
      summary = "Half-illuminated moon visible in morning sky.";
    }
    
    if (includeEvent) {
      events.push({
        id: `moon-${current.toISOString().split('T')[0]}`,
        title,
        date: current.toISOString(),
        dateDisplay: formatDate(current),
        window: "All night",
        visibility: phase.illumination > 80 ? "excellent" : "good",
        visibilityScore: 100 - phase.illumination,
        summary,
        type: "moon"
      });
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return events;
}

/**
 * Generate meteor shower events
 */
function generateMeteorShowerEvents(
  fromDate: Date,
  toDate: Date,
  coords?: Coordinates
): AstronomyEvent[] {
  const events: AstronomyEvent[] = [];
  
  for (const shower of METEOR_SHOWERS_2026) {
    // Check if peak is in our date range
    if (shower.peak >= fromDate && shower.peak <= toDate) {
      const moonPhase = calculateMoonPhase(shower.peak);
      
      // Calculate visibility based on moon interference
      const baseScore = Math.min(100, shower.zhr);
      const moonInterference = moonPhase.illumination;
      const visibilityScore = Math.round(baseScore * (1 - moonInterference / 150));
      
      let visibility: AstronomyEvent["visibility"];
      if (visibilityScore >= 80) visibility = "excellent";
      else if (visibilityScore >= 60) visibility = "good";
      else if (visibilityScore >= 40) visibility = "fair";
      else visibility = "poor";
      
      const moonCondition = moonPhase.illumination < 30 
        ? "Dark skies - excellent conditions!"
        : moonPhase.illumination < 60
        ? "Some moonlight, but still observable."
        : "Bright moonlight may reduce visibility.";
      
      events.push({
        id: `meteor-${shower.name.toLowerCase().replace(/\s+/g, '-')}-2026`,
        title: `${shower.name} Meteor Shower`,
        date: shower.peak.toISOString(),
        dateDisplay: formatDate(shower.peak),
        window: "10:00 PM – 4:00 AM",
        peak: "Around 2:00 AM local time",
        visibility,
        visibilityScore,
        summary: `Peak rate: ${shower.zhr} meteors/hour. ${moonCondition}`,
        type: "meteor"
      });
    }
  }
  
  return events;
}

/**
 * Generate planetary events (simplified - in production, use precise ephemeris)
 */
function generatePlanetaryEvents(fromDate: Date, toDate: Date): AstronomyEvent[] {
  const events: AstronomyEvent[] = [];
  
  // Hardcoded notable 2026 events
  // In production, calculate these from orbital mechanics or use NASA APIs
  const planetaryEvents = [
    {
      date: new Date("2026-02-09"),
      title: "Venus at Greatest Elongation East",
      summary: "Venus reaches maximum separation from Sun. Best evening viewing.",
      visibility: "excellent" as const,
      score: 95
    },
    {
      date: new Date("2026-03-15"),
      title: "Mars-Jupiter Conjunction",
      summary: "Mars and Jupiter appear very close in the evening sky.",
      visibility: "good" as const,
      score: 85
    },
    {
      date: new Date("2026-04-18"),
      title: "Saturn at Opposition",
      summary: "Saturn at its brightest and best positioned for observation.",
      visibility: "excellent" as const,
      score: 92
    },
    {
      date: new Date("2026-06-20"),
      title: "Summer Solstice",
      summary: "Longest day of the year in Northern Hemisphere. Shortest night.",
      visibility: "good" as const,
      score: 70
    },
    {
      date: new Date("2026-09-22"),
      title: "Jupiter at Opposition",
      summary: "Jupiter at closest approach to Earth. Prime viewing all night.",
      visibility: "excellent" as const,
      score: 98
    }
  ];
  
  for (const event of planetaryEvents) {
    if (event.date >= fromDate && event.date <= toDate) {
      events.push({
        id: `planet-${event.date.toISOString().split('T')[0]}`,
        title: event.title,
        date: event.date.toISOString(),
        dateDisplay: formatDate(event.date),
        window: "Dusk – Dawn",
        visibility: event.visibility,
        visibilityScore: event.score,
        summary: event.summary,
        type: "planet"
      });
    }
  }
  
  return events;
}

/**
 * Generate all upcoming astronomy events
 */
export function generateUpcomingEvents(
  coords?: Coordinates,
  fromDate: Date = new Date(),
  daysAhead: number = 60
): AstronomyEvent[] {
  const toDate = new Date(fromDate);
  toDate.setDate(toDate.getDate() + daysAhead);
  
  const events: AstronomyEvent[] = [
    ...generateMoonEvents(fromDate, toDate),
    ...generateMeteorShowerEvents(fromDate, toDate, coords),
    ...generatePlanetaryEvents(fromDate, toDate)
  ];
  
  // Sort by date
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return events;
}

/**
 * Get tonight's special events
 */
export function getTonightEvents(coords?: Coordinates): AstronomyEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return generateUpcomingEvents(coords, today, 1);
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}

/**
 * Check if a meteor shower is active on given date
 */
export function getActiveMeteorShowers(date: Date = new Date()): typeof METEOR_SHOWERS_2026 {
  return METEOR_SHOWERS_2026.filter(shower => {
    const activeStart = new Date(shower.active.start);
    const activeEnd = new Date(shower.active.end);
    return date >= activeStart && date <= activeEnd;
  });
}
