/**
 * Aurora Forecast Integration
 *
 * Uses NOAA Space Weather Prediction Center (SWPC) data:
 * - Planetary Kp Index (current and forecast)
 * - Aurora visibility probability based on geomagnetic latitude
 *
 * No API key required - public NOAA data
 */

export type KpForecast = {
  time: string;
  kp: number;
  observed: boolean;
};

export type AuroraForecast = {
  current: {
    kp: number;
    stormLevel: "none" | "minor" | "moderate" | "strong" | "severe" | "extreme";
    description: string;
  };
  forecast: KpForecast[];
  visibility: {
    probability: "none" | "unlikely" | "possible" | "likely" | "high";
    minimumLatitude: number;
    message: string;
  };
  source: "noaa" | "estimated";
  fetchedAt: string;
};

// Kp to storm level mapping (NOAA G-scale)
function getStormLevel(kp: number): AuroraForecast["current"]["stormLevel"] {
  if (kp >= 9) return "extreme";    // G5
  if (kp >= 8) return "severe";     // G4
  if (kp >= 7) return "strong";     // G3
  if (kp >= 6) return "moderate";   // G2
  if (kp >= 5) return "minor";      // G1
  return "none";
}

function getStormDescription(kp: number): string {
  if (kp >= 9) return "Extreme geomagnetic storm (G5) - Aurora visible at very low latitudes";
  if (kp >= 8) return "Severe geomagnetic storm (G4) - Aurora visible in mid-latitudes";
  if (kp >= 7) return "Strong geomagnetic storm (G3) - Aurora possible at mid-latitudes";
  if (kp >= 6) return "Moderate geomagnetic storm (G2) - Enhanced aurora activity";
  if (kp >= 5) return "Minor geomagnetic storm (G1) - Aurora visible at high latitudes";
  if (kp >= 4) return "Active conditions - Aurora possible at high latitudes";
  if (kp >= 3) return "Unsettled conditions - Aurora at polar regions";
  return "Quiet conditions - Aurora limited to polar regions";
}

// Approximate minimum geomagnetic latitude for aurora visibility based on Kp
function getMinimumLatitude(kp: number): number {
  // Empirical relationship: latitude ≈ 67 - (kp * 3)
  // Kp 0: ~67° | Kp 5: ~52° | Kp 9: ~40°
  return Math.max(30, Math.round(67 - kp * 3));
}

// Calculate visibility probability for a given geographic latitude
function getVisibilityProbability(
  kp: number,
  userLatitude: number
): AuroraForecast["visibility"] {
  const absLat = Math.abs(userLatitude);
  const minLat = getMinimumLatitude(kp);

  let probability: AuroraForecast["visibility"]["probability"];
  let message: string;

  if (absLat >= minLat + 10) {
    probability = "high";
    message = "Excellent aurora viewing conditions for your latitude";
  } else if (absLat >= minLat + 5) {
    probability = "likely";
    message = "Good chance of aurora visibility";
  } else if (absLat >= minLat) {
    probability = "possible";
    message = "Aurora may be visible on the northern horizon";
  } else if (absLat >= minLat - 5) {
    probability = "unlikely";
    message = "Aurora unlikely but possible during strong activity";
  } else {
    probability = "none";
    message = "Too far south for aurora visibility at current activity levels";
  }

  return { probability, minimumLatitude: minLat, message };
}

/**
 * Fetch current Kp index and 3-day forecast from NOAA SWPC
 */
export async function fetchAuroraForecast(lat: number): Promise<AuroraForecast> {
  try {
    // NOAA SWPC provides Kp index as JSON
    // Planetary K-index (estimated)
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json", {
        signal: AbortSignal.timeout(10000),
        next: { revalidate: 900 } // 15 min cache
      }),
      fetch("https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json", {
        signal: AbortSignal.timeout(10000),
        next: { revalidate: 3600 } // 1 hour cache
      })
    ]);

    if (!currentResponse.ok) {
      throw new Error(`NOAA Kp current API error: ${currentResponse.status}`);
    }

    // Parse current Kp
    // Format: [["time_tag","Kp","observed","noaa_scale"], ["2024-01-01 00:00:00","2.67","observed","0"], ...]
    const currentData = await currentResponse.json() as string[][];
    const latestKp = parseCurrentKp(currentData);

    // Parse forecast
    let forecast: KpForecast[] = [];
    if (forecastResponse.ok) {
      const forecastData = await forecastResponse.json() as string[][];
      forecast = parseForecast(forecastData);
    }

    const visibility = getVisibilityProbability(latestKp, lat);

    return {
      current: {
        kp: latestKp,
        stormLevel: getStormLevel(latestKp),
        description: getStormDescription(latestKp)
      },
      forecast,
      visibility,
      source: "noaa",
      fetchedAt: new Date().toISOString()
    };
  } catch (error) {
    console.warn("[aurora] Failed to fetch NOAA data:", {
      error: error instanceof Error ? error.message : String(error)
    });
    return buildEstimatedForecast(lat);
  }
}

function parseCurrentKp(data: string[][]): number {
  // Skip header row, get most recent entry
  if (data.length < 2) return 2;

  const latest = data[data.length - 1];
  const kpValue = parseFloat(latest[1]);

  return isNaN(kpValue) ? 2 : Math.round(kpValue * 10) / 10;
}

function parseForecast(data: string[][]): KpForecast[] {
  // Format: [["time_tag","Kp","observed","noaa_scale"], ...]
  if (data.length < 2) return [];

  return data.slice(1, 13).map(row => ({ // Next 12 periods (3 days at 3-hour intervals)
    time: row[0],
    kp: parseFloat(row[1]) || 2,
    observed: row[2] === "observed"
  }));
}

function buildEstimatedForecast(lat: number): AuroraForecast {
  const estimatedKp = 2; // Quiet conditions as default
  return {
    current: {
      kp: estimatedKp,
      stormLevel: "none",
      description: "Unable to fetch current data - assuming quiet conditions"
    },
    forecast: [],
    visibility: getVisibilityProbability(estimatedKp, lat),
    source: "estimated",
    fetchedAt: new Date().toISOString()
  };
}
