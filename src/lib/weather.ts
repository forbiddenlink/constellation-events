/**
 * Weather API Integration
 * 
 * Supports multiple weather services for sky quality assessment:
 * - OpenWeather API (free tier available)
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
};

type WeatherProvider = "openweather" | "clearoutside" | "visualcrossing";

const PROVIDER = (process.env.WEATHER_API_PROVIDER as WeatherProvider) || "openweather";

/**
 * Fetch current sky quality for given coordinates
 */
export async function fetchSkyQuality(lat: number, lng: number): Promise<SkyQuality> {
  switch (PROVIDER) {
    case "openweather":
      return fetchOpenWeather(lat, lng);
    case "clearoutside":
      return fetchClearOutside(lat, lng);
    case "visualcrossing":
      return fetchVisualCrossing(lat, lng);
    default:
      throw new Error(`Unknown weather provider: ${PROVIDER}`);
  }
}

async function fetchOpenWeather(lat: number, lng: number): Promise<SkyQuality> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY not configured");
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
  const response = await fetch(url, { next: { revalidate: 1800 } });

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
    quality
  };
}

async function fetchClearOutside(lat: number, lng: number): Promise<SkyQuality> {
  // TODO: Implement Clear Outside API integration
  // https://clearoutside.com/
  throw new Error("Clear Outside integration not yet implemented");
}

async function fetchVisualCrossing(lat: number, lng: number): Promise<SkyQuality> {
  // TODO: Implement Visual Crossing API integration
  // https://www.visualcrossing.com/
  throw new Error("Visual Crossing integration not yet implemented");
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
