/**
 * Real astronomy event generator
 * 
 * Generates upcoming celestial events including:
 * - Moon phases
 * - Meteor showers
 * - Planetary conjunctions
 * - Solar system events
 */

import * as Astronomy from "astronomy-engine";
import { calculateMoonPhase, formatTimeRange } from "./astronomy";
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

type MeteorShowerDef = {
  name: string;
  /** Peak month (1-12) and day. Peaks recur on the same calendar day each year (give or take one day). */
  peak: { month: number; day: number };
  zhr: number;
  active: { start: { month: number; day: number }; end: { month: number; day: number } };
};

export type MeteorShower = {
  name: string;
  peak: Date;
  zhr: number;
  active: { start: string; end: string };
};

/**
 * Recurring meteor showers. Peak dates are the typical IMO calendar day, which
 * drifts by at most a day between years, so they apply to any year.
 */
const METEOR_SHOWERS: MeteorShowerDef[] = [
  { name: "Quadrantids", peak: { month: 1, day: 3 }, zhr: 120, active: { start: { month: 1, day: 1 }, end: { month: 1, day: 12 } } },
  { name: "Lyrids", peak: { month: 4, day: 22 }, zhr: 18, active: { start: { month: 4, day: 16 }, end: { month: 4, day: 25 } } },
  { name: "Eta Aquariids", peak: { month: 5, day: 6 }, zhr: 50, active: { start: { month: 4, day: 19 }, end: { month: 5, day: 28 } } },
  { name: "Perseids", peak: { month: 8, day: 12 }, zhr: 100, active: { start: { month: 7, day: 17 }, end: { month: 8, day: 24 } } },
  { name: "Orionids", peak: { month: 10, day: 21 }, zhr: 25, active: { start: { month: 10, day: 2 }, end: { month: 11, day: 7 } } },
  { name: "Leonids", peak: { month: 11, day: 17 }, zhr: 15, active: { start: { month: 11, day: 6 }, end: { month: 11, day: 30 } } },
  { name: "Geminids", peak: { month: 12, day: 14 }, zhr: 150, active: { start: { month: 12, day: 4 }, end: { month: 12, day: 20 } } },
];

function utcDate(year: number, md: { month: number; day: number }): Date {
  return new Date(Date.UTC(year, md.month - 1, md.day));
}

function isoDay(date: Date): string {
  return date.toISOString().split("T")[0];
}

/** Instantiate the recurring shower table for a given year. */
function showersForYear(year: number): MeteorShower[] {
  return METEOR_SHOWERS.map((s) => ({
    name: s.name,
    peak: utcDate(year, s.peak),
    zhr: s.zhr,
    active: { start: isoDay(utcDate(year, s.active.start)), end: isoDay(utcDate(year, s.active.end)) },
  }));
}

/**
 * Generate upcoming moon phase events
 */
function generateMoonEvents(fromDate: Date, toDate: Date): AstronomyEvent[] {
  const events: AstronomyEvent[] = [];
  // Distance from the exact phase moment for the event currently at the end
  // of `events` (0 = New, 0.25 = First Quarter, 0.5 = Full, 0.75 = Last
  // Quarter). Tracked alongside `events` so a later, closer day in the same
  // cluster can replace an earlier, worse-fit one (see below).
  let lastPhaseDistance = Infinity;
  const current = new Date(fromDate);

  // Check each day for significant moon phases
  while (current <= toDate) {
    const phase = calculateMoonPhase(current);

    // Only include major phases (New, First Quarter, Full, Last Quarter)
    let includeEvent = false;
    let title = "";
    let summary = "";
    let phaseDistance = 0;

    if (phase.phase < 0.02 || phase.phase > 0.98) {
      includeEvent = true;
      title = "New Moon";
      summary = "Ideal for deep-sky observation. No moonlight interference.";
      phaseDistance = Math.min(phase.phase, 1 - phase.phase);
    } else if (Math.abs(phase.phase - 0.25) < 0.02) {
      includeEvent = true;
      title = "First Quarter Moon";
      summary = "Half-illuminated moon visible in evening sky.";
      phaseDistance = Math.abs(phase.phase - 0.25);
    } else if (Math.abs(phase.phase - 0.5) < 0.02) {
      includeEvent = true;
      title = "Full Moon";
      summary = "Bright moonlight affects deep-sky viewing. Great for lunar observation.";
      phaseDistance = Math.abs(phase.phase - 0.5);
    } else if (Math.abs(phase.phase - 0.75) < 0.02) {
      includeEvent = true;
      title = "Last Quarter Moon";
      summary = "Half-illuminated moon visible in morning sky.";
      phaseDistance = Math.abs(phase.phase - 0.75);
    }

    if (includeEvent) {
      const newEvent: AstronomyEvent = {
        id: `moon-${current.toISOString().split('T')[0]}`,
        title,
        date: current.toISOString(),
        dateDisplay: formatDate(current),
        window: "All night",
        visibility: phase.illumination > 80 ? "excellent" : "good",
        visibilityScore: 100 - phase.illumination,
        summary,
        type: "moon"
      };

      // The synodic month advances the phase by ~0.034/day, so a
      // 0.04-wide window can span two consecutive calendar days near the
      // exact moment, producing back-to-back duplicates (e.g. two "New
      // Moon" entries a day apart, which never happens in reality). Keep
      // only the single day closest to the exact phase per cluster.
      const previous = events[events.length - 1];
      const daysSincePrevious = previous
        ? (current.getTime() - new Date(previous.date).getTime()) / 86400000
        : Infinity;
      const inSameCluster = previous?.title === title && daysSincePrevious <= 3;

      if (inSameCluster) {
        if (phaseDistance < lastPhaseDistance) {
          events[events.length - 1] = newEvent;
          lastPhaseDistance = phaseDistance;
        }
        // else: the previously kept day is the closer fit; drop this one.
      } else {
        events.push(newEvent);
        lastPhaseDistance = phaseDistance;
      }
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
  
  const years: number[] = [];
  for (let y = fromDate.getUTCFullYear(); y <= toDate.getUTCFullYear(); y++) years.push(y);

  for (const shower of years.flatMap(showersForYear)) {
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
        id: `meteor-${shower.name.toLowerCase().replace(/\s+/g, '-')}-${shower.peak.getUTCFullYear()}`,
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
 * One-off 2026 entries that are not computed. They are only emitted for 2026
 * so they cannot show up as wrong dates in later years.
 * UNVERIFIED: the Mars-Jupiter "conjunction" date has no source on file.
 */
const YEAR_LIMITED_EVENTS_2026 = [
  {
    date: new Date("2026-03-15"),
    title: "Mars-Jupiter Conjunction",
    summary: "Mars and Jupiter appear very close in the evening sky.",
    visibility: "good" as const,
    score: 85,
    // The events feed's "Conjunctions" filter tab matches on the `type`
    // field, not the title text.
    type: "conjunction" as const,
  },
];

type ComputedEvent = {
  id: string;
  date: Date;
  title: string;
  summary: string;
  visibility: AstronomyEvent["visibility"];
  score: number;
  type: AstronomyEvent["type"];
  window?: string;
};

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Equinoxes and solstices, from astronomy-engine, for every year in range. */
function computeSeasonEvents(fromYear: number, toYear: number): ComputedEvent[] {
  const out: ComputedEvent[] = [];
  for (let y = fromYear; y <= toYear; y++) {
    const s = Astronomy.Seasons(y);
    out.push(
      { id: `season-${y}-march-equinox`, date: s.mar_equinox.date, title: "March Equinox", summary: "Day and night are nearly equal. Spring begins in the Northern Hemisphere, autumn in the Southern.", visibility: "good", score: 65, type: "other" },
      { id: `season-${y}-june-solstice`, date: s.jun_solstice.date, title: "June Solstice", summary: "Longest day of the year in the Northern Hemisphere, shortest night.", visibility: "good", score: 70, type: "other" },
      { id: `season-${y}-september-equinox`, date: s.sep_equinox.date, title: "September Equinox", summary: "Day and night are nearly equal. Autumn begins in the Northern Hemisphere, spring in the Southern.", visibility: "good", score: 65, type: "other" },
      { id: `season-${y}-december-solstice`, date: s.dec_solstice.date, title: "December Solstice", summary: "Shortest day of the year in the Northern Hemisphere, longest night.", visibility: "good", score: 70, type: "other" },
    );
  }
  return out;
}

/** Lunar and solar eclipses in [from, to], computed (no year-specific table). */
function computeEclipseEvents(from: Date, to: Date): ComputedEvent[] {
  const out: ComputedEvent[] = [];
  const kindLabel = (k: string) => k.charAt(0).toUpperCase() + k.slice(1);

  let lunar = Astronomy.SearchLunarEclipse(from);
  for (let i = 0; i < 40 && lunar.peak.date <= to; i++) {
    const kind = String(lunar.kind);
    const showy = kind === "total" || kind === "partial";
    out.push({
      id: `eclipse-lunar-${isoDay(lunar.peak.date)}`,
      date: lunar.peak.date,
      title: `${kindLabel(kind)} Lunar Eclipse`,
      summary: kind === "penumbral"
        ? "The Moon dims only slightly in Earth's outer shadow. Subtle and hard to notice. Visible wherever the Moon is up."
        : "The Moon passes through Earth's shadow. Visible from anywhere the Moon is above the horizon.",
      visibility: showy ? "excellent" : "fair",
      score: kind === "total" ? 98 : kind === "partial" ? 85 : 40,
      type: "eclipse",
      window: "Check local moonrise/moonset",
    });
    lunar = Astronomy.NextLunarEclipse(lunar.peak);
  }

  let solar = Astronomy.SearchGlobalSolarEclipse(from);
  for (let i = 0; i < 40 && solar.peak.date <= to; i++) {
    const kind = String(solar.kind);
    out.push({
      id: `eclipse-solar-${isoDay(solar.peak.date)}`,
      date: solar.peak.date,
      title: `${kindLabel(kind)} Solar Eclipse`,
      summary: "Visible only along a narrow path or region of Earth. Never look at the Sun without certified eclipse glasses.",
      visibility: kind === "partial" ? "fair" : "excellent",
      score: kind === "total" ? 98 : kind === "annular" ? 90 : 60,
      type: "eclipse",
      window: "Daytime, depends on location",
    });
    solar = Astronomy.NextGlobalSolarEclipse(solar.peak);
  }
  return out;
}

/** Oppositions (Mars, Jupiter, Saturn) and Venus greatest elongations in [from, to]. */
function computePlanetEvents(from: Date, to: Date): ComputedEvent[] {
  const out: ComputedEvent[] = [];
  const outer: Array<[Astronomy.Body, string, number, string]> = [
    [Astronomy.Body.Mars, "Mars", 90, "Mars at its closest and brightest. Best time to observe surface detail."],
    [Astronomy.Body.Jupiter, "Jupiter", 98, "Jupiter at closest approach to Earth. Prime viewing all night."],
    [Astronomy.Body.Saturn, "Saturn", 92, "Saturn at its brightest and best positioned for observation."],
  ];
  for (const [body, name, score, summary] of outer) {
    let t = Astronomy.SearchRelativeLongitude(body, 0, from);
    for (let i = 0; i < 4 && t.date <= to; i++) {
      out.push({ id: `planet-${slug(name)}-opposition-${isoDay(t.date)}`, date: t.date, title: `${name} at Opposition`, summary, visibility: "excellent", score, type: "planet" });
      t = Astronomy.SearchRelativeLongitude(body, 0, new Date(t.date.getTime() + 30 * 86400000));
    }
  }

  let e = Astronomy.SearchMaxElongation(Astronomy.Body.Venus, from);
  for (let i = 0; i < 6 && e.time.date <= to; i++) {
    const east = e.visibility === "evening";
    out.push({
      id: `planet-venus-elongation-${isoDay(e.time.date)}`,
      date: e.time.date,
      title: east ? "Venus at Greatest Elongation East" : "Venus at Greatest Elongation West",
      summary: east
        ? "Venus reaches maximum separation from the Sun. Best evening viewing."
        : "Venus reaches maximum separation from the Sun. Best morning viewing.",
      visibility: "excellent",
      score: 95,
      type: "planet",
    });
    e = Astronomy.SearchMaxElongation(Astronomy.Body.Venus, new Date(e.time.date.getTime() + 30 * 86400000));
  }
  return out;
}

/**
 * Generate planetary, seasonal and eclipse events. Everything here is computed
 * with astronomy-engine, so it works for any year. Only the 2026 one-offs above
 * are year-limited.
 */
function generatePlanetaryEvents(fromDate: Date, toDate: Date): AstronomyEvent[] {
  const events: AstronomyEvent[] = [];

  const computed: ComputedEvent[] = [
    ...computeSeasonEvents(fromDate.getUTCFullYear(), toDate.getUTCFullYear()),
    ...computePlanetEvents(fromDate, toDate),
    ...computeEclipseEvents(fromDate, toDate),
    ...YEAR_LIMITED_EVENTS_2026.map((e) => ({
      id: `planet-${isoDay(e.date)}`,
      date: e.date,
      title: e.title,
      summary: e.summary,
      visibility: e.visibility,
      score: e.score,
      type: e.type,
    })),
  ];

  for (const event of computed) {
    if (event.date >= fromDate && event.date <= toDate) {
      events.push({
        id: event.id,
        title: event.title,
        date: event.date.toISOString(),
        dateDisplay: formatDate(event.date),
        window: event.window ?? "Dusk – Dawn",
        visibility: event.visibility,
        visibilityScore: event.score,
        summary: event.summary,
        type: event.type,
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
export function getActiveMeteorShowers(date: Date = new Date()): MeteorShower[] {
  return showersForYear(date.getUTCFullYear()).filter((shower) => {
    const activeStart = new Date(shower.active.start);
    const activeEnd = new Date(shower.active.end);
    return date >= activeStart && date <= activeEnd;
  });
}
