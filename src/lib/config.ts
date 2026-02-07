/**
 * Application configuration and environment validation
 */

export const config = {
  // Mapbox
  mapbox: {
    token: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "",
    tileUrl: process.env.NEXT_PUBLIC_LIGHTPOLLUTION_TILES || ""
  },

  // Weather APIs
  weather: {
    provider: (process.env.WEATHER_API_PROVIDER as "openweather" | "clearoutside" | "visualcrossing") || "openweather",
    openWeatherKey: process.env.OPENWEATHER_API_KEY || "",
    clearOutsideKey: process.env.CLEAROUTSIDE_API_KEY || "",
    visualCrossingKey: process.env.VISUALCROSSING_API_KEY || ""
  },

  // Cloudflare R2
  r2: {
    bucket: process.env.R2_BUCKET || "",
    endpoint: process.env.R2_ENDPOINT || "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    publicBase: process.env.R2_PUBLIC_BASE || ""
  },

  // Default fallback location (Las Vegas)
  defaultLocation: {
    lat: 36.1147,
    lng: -115.1728
  },

  // Cache settings
  cache: {
    horizonsTTL: 3600 * 1000, // 1 hour
    weatherTTL: 1800 * 1000, // 30 minutes
    eventsTTL: 3600 * 6 * 1000 // 6 hours
  }
} as const;

/**
 * Check for required environment variables
 */
export function validateConfig() {
  const warnings: string[] = [];

  if (!config.mapbox.token) {
    warnings.push("NEXT_PUBLIC_MAPBOX_TOKEN is not set - maps will not work");
  }

  if (!config.mapbox.tileUrl) {
    warnings.push("NEXT_PUBLIC_LIGHTPOLLUTION_TILES is not set - light pollution overlay disabled");
  }

  if (!config.weather.openWeatherKey && config.weather.provider === "openweather") {
    warnings.push("OPENWEATHER_API_KEY is not set - live weather data unavailable");
  }

  return {
    valid: warnings.length === 0,
    warnings
  };
}

/**
 * Log configuration status on startup
 */
export function logConfigStatus() {
  if (typeof window !== "undefined") return; // Only run on server

  const { valid, warnings } = validateConfig();

  if (valid) {
    console.log("✅ Configuration valid - all required environment variables set");
  } else {
    console.warn("⚠️  Configuration warnings:");
    warnings.forEach((warning) => console.warn(`   - ${warning}`));
  }
}
