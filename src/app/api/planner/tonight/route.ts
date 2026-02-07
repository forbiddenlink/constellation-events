import { NextResponse } from "next/server";
import { parseCoordinates } from "@/lib/geo";
import { config } from "@/lib/config";
import { 
  calculateMoonPhase, 
  calculateOptimalWindow,
  calculateSunMoonTimes 
} from "@/lib/astronomy";
import { getTonightEvents, getActiveMeteorShowers } from "@/lib/events";
import { getDefaultTargets, fetchObserverTable } from "@/lib/horizons";

/**
 * GET /api/planner/tonight
 * 
 * Generate a comprehensive observation plan for tonight
 * Includes: optimal window, moon conditions, visible planets, events
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coords = parseCoordinates(
    searchParams.get("lat"),
    searchParams.get("lng")
  ) ?? config.defaultLocation;

  try {
    // Calculate moon phase and conditions
    const moonPhase = calculateMoonPhase();
    
    // Calculate optimal observation window
    const optimalWindow = calculateOptimalWindow(coords.lat, coords.lng);
    
    // Get sun/moon times
    const sunMoonTimes = calculateSunMoonTimes(coords.lat, coords.lng);
    
    // Get tonight's special events
    const tonightEvents = getTonightEvents(coords);
    
    // Get active meteor showers
    const activerShowers = getActiveMeteorShowers();
    
    // Get visible planets from JPL Horizons
    type VisiblePlanet = {
      name: string;
      type: string;
      bestAltitude: number;
      bestTime: string;
      visible: boolean;
    };
    
    let visiblePlanets: VisiblePlanet[] = [];
    try {
      const targets = getDefaultTargets();
      const planetData = await Promise.all(
        targets.map(async (target) => {
          const points = await fetchObserverTable(target, coords, 8);
          if (points.length === 0) return null;
          
          const best = points.reduce((max, point) => 
            point.elevation > max.elevation ? point : max, 
            points[0]
          );
          
          return {
            name: target.name,
            type: target.type,
            bestAltitude: Math.round(best.elevation),
            bestTime: best.timeLabel,
            visible: best.elevation > 15 // Above 15° is considered visible
          };
        })
      );
      
      visiblePlanets = planetData.filter((p): p is VisiblePlanet => p !== null && p.visible);
    } catch (error) {
      console.error("Failed to fetch planet data:", error);
    }

    // Generate recommendations
    const recommendations = [];
    
    // Moon observation recommendation
    if (moonPhase.illumination > 20) {
      recommendations.push({
        priority: "high",
        title: `Observe the ${moonPhase.name}`,
        description: `${Math.round(moonPhase.illumination)}% illuminated. Great for lunar features.`,
        timing: "After sunset"
      });
    } else {
      recommendations.push({
        priority: "high",
        title: "Dark sky advantage",
        description: "Low moonlight - perfect for deep-sky objects and galaxies.",
        timing: "All night"
      });
    }
    
    // Meteor shower recommendation
    if (activerShowers.length > 0) {
      const shower = activerShowers[0];
      recommendations.push({
        priority: "medium",
        title: `${shower.name} active`,
        description: `Peak rate: ${shower.zhr} meteors/hour. Best after midnight.`,
        timing: "After midnight"
      });
    }
    
    // Planet recommendation
    if (visiblePlanets.length > 0) {
      recommendations.push({
        priority: "medium",
        title: `${visiblePlanets.length} planet${visiblePlanets.length > 1 ? 's' : ''} visible`,
        description: visiblePlanets.map(p => p.name).join(", "),
        timing: "Check individual times"
      });
    }

    return NextResponse.json({
      location: coords,
      date: new Date().toISOString(),
      moon: {
        phase: moonPhase.name,
        illumination: moonPhase.illumination,
        age: moonPhase.age,
        rise: sunMoonTimes.moonrise,
        set: sunMoonTimes.moonset
      },
      sun: {
        sunset: sunMoonTimes.sunset,
        sunrise: sunMoonTimes.sunrise,
        astronomicalDusk: sunMoonTimes.astronomicalDusk,
        astronomicalDawn: sunMoonTimes.astronomicalDawn
      },
      optimalWindow: {
        start: optimalWindow.start,
        end: optimalWindow.end,
        quality: optimalWindow.quality,
        duration: Math.round((optimalWindow.end.getTime() - optimalWindow.start.getTime()) / (1000 * 60 * 60))
      },
      visiblePlanets,
      tonightEvents,
      activeShowers: activerShowers.map(s => ({
        name: s.name,
        zhr: s.zhr,
        peak: s.peak
      })),
      recommendations,
      overallQuality: calculateOverallQuality(moonPhase.illumination, optimalWindow.quality)
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate tonight plan",
        location: coords
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate overall tonight quality score
 */
function calculateOverallQuality(moonIllumination: number, windowQuality: number): {
  score: number;
  rating: string;
  description: string;
} {
  // Weight moon interference more heavily
  const score = Math.round(windowQuality * 0.7 + (100 - moonIllumination) * 0.3);
  
  let rating: string;
  let description: string;
  
  if (score >= 85) {
    rating = "Exceptional";
    description = "Outstanding conditions for all types of observation";
  } else if (score >= 70) {
    rating = "Excellent";
    description = "Great conditions for most celestial objects";
  } else if (score >= 55) {
    rating = "Good";
    description = "Favorable conditions for bright objects";
  } else if (score >= 40) {
    rating = "Fair";
    description = "Challenging but still worthwhile";
  } else {
    rating = "Poor";
    description = "Consider observing brighter objects only";
  }
  
  return { score, rating, description };
}
