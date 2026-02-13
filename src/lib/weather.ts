/**
 * Weather API Integration
 * 
 * Supports multiple weather services for sky quality assessment:
 * - OpenWeather API (free tier available)
 * - Open-Meteo API (free, no API key)
 * - Clear Outside API (astronomy-focused)
 * - Visual Crossing (historical + forecast)
 * 
 * Set WEATHER_API_PROVIDER and corresponding API key in .env.local
 */

export type SkyQuality = {
  cloudCover: number; // 0-100
  seeing: "excellent" | "good" | "fair" | "poor";
  transparency: number; // 0-100
  humidity: number; // percentage
  temperature: number; // celsius
  windSpeed: number; // km/h
  moonPhase: number; // 0-1 (0 = new, 0.5 = full)
  quality: number; // Overall 0-100 score
  source: "openweather" | "openmeteo" | "estimated";
};

type WeatherProvider = "auto" | "openweather" | "openmeteo" | "clearoutside" | "visualcrossing";

const PROVIDER = (process.env.WEATHER_API_PROVIDER as WeatherProvider) || "auto";

/**
 * Fetch current sky quality for given coordinates
 */
export async function fetchSkyQuality(lat: number, lng: number): Promise<SkyQuality> {
  try {
    switch (PROVIDER) {
      case "auto":
        return await fetchAuto(lat, lng);
      case "openweather":
        return await fetchOpenWeather(lat, lng);
      case "openmeteo":
        return await fetchOpenMeteo(lat, lng);
      case "clearoutside":
        return await fetchClearOutside(lat, lng);
      case "visualcrossing":
        return await fetchVisualCrossing(lat, lng);
      default:
        return buildEstimatedSkyQuality();
    }
  } catch (error) {
    console.warn("[weather] Failed to fetch sky quality, using estimate:", {
      provider: PROVIDER,
      error: error instanceof Error ? error.message : String(error)
    });
    return buildEstimatedSkyQuality();
  }
}

async function fetchAuto(lat: number, lng: number): Promise<SkyQuality> {
  const openWeatherKey = process.env.OPENWEATHER_API_KEY;
  if (openWeatherKey) {
    try {
      return await fetchOpenWeather(lat, lng);
    } catch (error) {
      console.warn("[weather] OpenWeather failed, falling back to Open-Meteo:", {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  return fetchOpenMeteo(lat, lng);
}

async function fetchOpenWeather(lat: number, lng: number): Promise<SkyQuality> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY not configured");
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    next: { revalidate: 1800 }
  });

  if (!response.ok) {
    throw new Error(`OpenWeather API error: ${response.status}`);
  }

  const data = await response.json();

  // Calculate astronomy-specific quality score
  const cloudCover = data.clouds?.all ?? 50;
  const humidity = data.main?.humidity ?? 50;
  const windSpeed = (data.wind?.speed ?? 0) * 3.6; // m/s to km/h

  // Simple quality algorithm (can be refined)
  const quality = calculateQuality(cloudCover, humidity, windSpeed);

  return {
    cloudCover,
    seeing: getSeeingCondition(windSpeed, humidity),
    transparency: 100 - cloudCover,
    humidity,
    temperature: data.main?.temp ?? 15,
    windSpeed,
    moonPhase: 0, // OpenWeather doesn't provide this, would need separate calculation
    quality,
    source: "openweather"
  };
}

async function fetchOpenMeteo(lat: number, lng: number): Promise<SkyQuality> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,wind_speed_10m,cloud_cover"
  );
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(10000),
    next: { revalidate: 1800 }
  });
  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    current?: {
      cloud_cover?: number;
      relative_humidity_2m?: number;
      wind_speed_10m?: number;
      temperature_2m?: number;
    };
  };

  const cloudCover = clampPercent(data.current?.cloud_cover ?? 50);
  const humidity = clampPercent(data.current?.relative_humidity_2m ?? 50);
  const windSpeed = Math.max(0, Number(data.current?.wind_speed_10m ?? 0));
  const quality = calculateQuality(cloudCover, humidity, windSpeed);

  return {
    cloudCover,
    seeing: getSeeingCondition(windSpeed, humidity),
    transparency: 100 - cloudCover,
    humidity,
    temperature: Number(data.current?.temperature_2m ?? 15),
    windSpeed,
    moonPhase: 0,
    quality,
    source: "openmeteo"
  };
}

async function fetchClearOutside(lat: number, lng: number): Promise<SkyQuality> {
  // TODO: Replace with native integration when API details are finalized.
  return fetchOpenMeteo(lat, lng);
}

async function fetchVisualCrossing(lat: number, lng: number): Promise<SkyQuality> {
  // TODO: Replace with native integration when API details are finalized.
  return fetchOpenMeteo(lat, lng);
}

/**
 * Calculate overall sky quality score (0-100)
 */
function calculateQuality(cloudCover: number, humidity: number, windSpeed: number): number {
  // Weight factors
  const cloudWeight = 0.6;
  const humidityWeight = 0.2;
  const windWeight = 0.2;

  // Invert cloud cover and humidity (lower is better)
  const cloudScore = 100 - cloudCover;
  const humidityScore = Math.max(0, 100 - humidity);

  // Wind: optimal is 0-15 km/h, worse as it increases
  const windScore = Math.max(0, 100 - Math.min(100, windSpeed * 2));

  return Math.round(
    cloudScore * cloudWeight + 
    humidityScore * humidityWeight + 
    windScore * windWeight
  );
}

/**
 * Determine seeing conditions for astronomy
 */
function getSeeingCondition(windSpeed: number, humidity: number): SkyQuality["seeing"] {
  if (windSpeed > 30 || humidity > 80) return "poor";
  if (windSpeed > 20 || humidity > 70) return "fair";
  if (windSpeed > 10 || humidity > 60) return "good";
  return "excellent";
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildEstimatedSkyQuality(): SkyQuality {
  const cloudCover = 45;
  const humidity = 55;
  const windSpeed = 8;
  return {
    cloudCover,
    seeing: getSeeingCondition(windSpeed, humidity),
    transparency: 100 - cloudCover,
    humidity,
    temperature: 15,
    windSpeed,
    moonPhase: 0,
    quality: calculateQuality(cloudCover, humidity, windSpeed),
    source: "estimated"
  };
}
