import { NextResponse } from "next/server";
import { parseCoordinates } from "@/lib/geo";
import type { Coordinates } from "@/lib/geo";
import { config } from "@/lib/config";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { 
  calculateMoonPhase, 
  calculateOptimalWindow,
  calculateSunMoonTimes 
} from "@/lib/astronomy";
import { getTonightEvents, getActiveMeteorShowers } from "@/lib/events";
import { getDefaultTargets, fetchObserverTable } from "@/lib/horizons";
import { fetchSkyQuality } from "@/lib/weather";
import { estimateDarkSkyScore } from "@/lib/locations";
import { getCache, setCache } from "@/lib/cache";
import { getISSPasses, formatPassTime, type ISSPass } from "@/lib/iss";

const PLANNER_TTL_MS = 10 * 60 * 1000;
const HORIZONS_TIMEOUT_MS = 7000;

type VisiblePlanet = {
  name: string;
  type: string;
  bestAltitude: number;
  bestTime: string;
  visible: boolean;
};

type PlannerPayload = {
  location: Coordinates;
  date: string;
  moon: {
    phase: string;
    illumination: number;
    age: number;
    rise: Date | null;
    set: Date | null;
  };
  sun: {
    sunset: Date;
    sunrise: Date;
    astronomicalDusk: Date;
    astronomicalDawn: Date;
  };
  optimalWindow: {
    start: Date;
    end: Date;
    quality: number;
    duration: number;
  };
  localDarkSkyScore: number;
  weather: {
    cloudCover: number;
    seeing: string;
    transparency: number;
    humidity: number;
    windSpeed: number;
    quality: number;
    source: string;
  } | null;
  visiblePlanets: VisiblePlanet[];
  tonightEvents: ReturnType<typeof getTonightEvents>;
  activeShowers: {
    name: string;
    zhr: number;
    peak: Date;
  }[];
  issPasses: {
    risetime: string;
    duration: number;
    maxAltitude: number;
    brightness: string;
    formatted: string;
  }[];
  recommendations: {
    priority: string;
    title: string;
    description: string;
    timing: string;
  }[];
  overallQuality: {
    score: number;
    rating: string;
    description: string;
  };
  generatedAt: string;
};

/**
 * GET /api/planner/tonight
 * 
 * Generate a comprehensive observation plan for tonight
 * Includes: optimal window, moon conditions, visible planets, events
 */
export async function GET(request: Request) {
  const rateLimit = checkRateLimit(
    `planner:${getClientIp(request)}`,
    RATE_LIMITS.externalApi
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfterSeconds: rateLimit.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const coords = parseCoordinates(
    searchParams.get("lat"),
    searchParams.get("lng")
  ) ?? config.defaultLocation;
  const cacheKey = getPlannerCacheKey(coords);

  const cached = getCache<PlannerPayload>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const skyQualityPromise = fetchSkyQuality(coords.lat, coords.lng).catch(() => null);

    // Calculate moon phase and conditions
    const moonPhase = calculateMoonPhase();
    
    // Calculate optimal observation window
    const optimalWindow = calculateOptimalWindow(coords.lat, coords.lng);
    
    // Get sun/moon times
    const sunMoonTimes = calculateSunMoonTimes(coords.lat, coords.lng);
    
    // Get tonight's special events
    const tonightEvents = getTonightEvents(coords);
    
    // Get active meteor showers
    const activeShowers = getActiveMeteorShowers();
    
    const visiblePlanetsPromise = fetchVisiblePlanets(coords);
    const issPassesPromise = getISSPasses(coords, { count: 3 }).catch(() => []);

    const [visiblePlanets, skyQuality, issPasses] = await Promise.all([
      visiblePlanetsPromise,
      skyQualityPromise,
      issPassesPromise
    ]);

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
    if (activeShowers.length > 0) {
      const shower = activeShowers[0];
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

    // ISS pass recommendation
    if (issPasses.length > 0) {
      const nextPass = issPasses[0];
      recommendations.push({
        priority: "high",
        title: "ISS pass tonight",
        description: `Visible for ${Math.round(nextPass.duration / 60)} minutes, reaching ${Math.round(nextPass.maxAltitude)}° altitude.`,
        timing: formatPassTime(nextPass)
      });
    }

    if (skyQuality) {
      if (skyQuality.cloudCover > 55) {
        recommendations.push({
          priority: "medium",
          title: "Cloud cover elevated",
          description: `${skyQuality.cloudCover}% cloud cover. Prioritize brighter targets and lunar features.`,
          timing: "Check for short clear windows"
        });
      } else {
        recommendations.push({
          priority: "high",
          title: "Weather supports deep-sky viewing",
          description: `${skyQuality.cloudCover}% clouds and ${skyQuality.seeing} seeing conditions right now.`,
          timing: "Use optimal window"
        });
      }
    }

    const localDarkSkyScore = estimateDarkSkyScore(coords);
    const overallQuality = calculateOverallQuality({
      moonIllumination: moonPhase.illumination,
      windowQuality: optimalWindow.quality,
      darkSkyScore: localDarkSkyScore,
      weatherQuality: skyQuality?.quality
    });

    const payload: PlannerPayload = {
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
      localDarkSkyScore,
      weather: skyQuality
        ? {
            cloudCover: skyQuality.cloudCover,
            seeing: skyQuality.seeing,
            transparency: skyQuality.transparency,
            humidity: skyQuality.humidity,
            windSpeed: skyQuality.windSpeed,
            quality: skyQuality.quality,
            source: skyQuality.source
          }
        : null,
      visiblePlanets,
      tonightEvents,
      activeShowers: activeShowers.map(s => ({
        name: s.name,
        zhr: s.zhr,
        peak: s.peak
      })),
      issPasses: issPasses.map(pass => ({
        risetime: pass.risetime.toISOString(),
        duration: pass.duration,
        maxAltitude: pass.maxAltitude,
        brightness: pass.brightness,
        formatted: formatPassTime(pass)
      })),
      recommendations,
      overallQuality,
      generatedAt: new Date().toISOString()
    };

    setCache(cacheKey, payload, PLANNER_TTL_MS);
    return NextResponse.json(payload);
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

function getPlannerCacheKey(coords: Coordinates) {
  // Round coordinates to increase cache reuse for nearby users.
  return `planner-tonight:${coords.lat.toFixed(2)}:${coords.lng.toFixed(2)}`;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

async function fetchVisiblePlanets(coords: Coordinates): Promise<VisiblePlanet[]> {
  const targets = getDefaultTargets().filter((target) => target.type === "Planet");
  const planetData = await Promise.all(
    targets.map(async (target) => {
      try {
        const points = await withTimeout(
          fetchObserverTable(target, coords, 8),
          HORIZONS_TIMEOUT_MS
        );
        if (points.length === 0) return null;

        const best = points.reduce(
          (max, point) => (point.elevation > max.elevation ? point : max),
          points[0]
        );

        if (best.elevation <= 15) return null;
        return {
          name: target.name,
          type: target.type,
          bestAltitude: Math.round(best.elevation),
          bestTime: best.timeLabel,
          visible: true
        };
      } catch {
        return null;
      }
    })
  );

  return planetData.filter((planet): planet is VisiblePlanet => Boolean(planet));
}

/**
 * Calculate overall tonight quality score
 */
function calculateOverallQuality(params: {
  moonIllumination: number;
  windowQuality: number;
  darkSkyScore: number;
  weatherQuality?: number;
}): {
  score: number;
  rating: string;
  description: string;
} {
  const weather = params.weatherQuality ?? 65;
  const score = Math.round(
    params.windowQuality * 0.35 +
      (100 - params.moonIllumination) * 0.25 +
      weather * 0.25 +
      params.darkSkyScore * 0.15
  );
  
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
