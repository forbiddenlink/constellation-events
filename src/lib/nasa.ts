/**
 * NASA API integrations
 *
 * Astronomy Picture of the Day (APOD) and other NASA APIs
 * https://api.nasa.gov/
 */

const NASA_API_BASE = "https://api.nasa.gov";
const NASA_API_KEY = process.env.NASA_API_KEY || "DEMO_KEY";

export interface APODResponse {
  date: string;
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: "image" | "video";
  copyright?: string;
  thumbnail_url?: string;
}

export interface APODData {
  date: string;
  title: string;
  explanation: string;
  imageUrl: string;
  hdImageUrl?: string;
  mediaType: "image" | "video";
  copyright?: string;
  thumbnailUrl?: string;
  source: "nasa" | "cached" | "fallback";
}

// Cache APOD for the day
let cachedAPOD: { data: APODData; expiry: number } | null = null;

/**
 * Fetch NASA Astronomy Picture of the Day
 */
export async function getAPOD(date?: string): Promise<APODData> {
  // Check cache first (valid for 1 hour)
  const now = Date.now();
  if (cachedAPOD && cachedAPOD.expiry > now && !date) {
    return { ...cachedAPOD.data, source: "cached" };
  }

  try {
    const params = new URLSearchParams({
      api_key: NASA_API_KEY
    });

    if (date) {
      params.set("date", date);
    }

    const response = await fetch(
      `${NASA_API_BASE}/planetary/apod?${params.toString()}`,
      {
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`NASA API error: ${response.status}`);
    }

    const data: APODResponse = await response.json();

    const apodData: APODData = {
      date: data.date,
      title: data.title,
      explanation: data.explanation,
      imageUrl: data.url,
      hdImageUrl: data.hdurl,
      mediaType: data.media_type,
      copyright: data.copyright,
      thumbnailUrl: data.thumbnail_url,
      source: "nasa"
    };

    // Cache the result
    if (!date) {
      cachedAPOD = {
        data: apodData,
        expiry: now + 3600000 // 1 hour
      };
    }

    return apodData;
  } catch (error) {
    console.error("[nasa] Failed to fetch APOD:", error);

    // Return fallback data
    return getFallbackAPOD();
  }
}

/**
 * Fallback APOD data when API is unavailable
 */
function getFallbackAPOD(): APODData {
  return {
    date: new Date().toISOString().split("T")[0],
    title: "The Milky Way over Torres del Paine",
    explanation:
      "The Milky Way arches over the Torres del Paine National Park in Chile. " +
      "The central bulge of our galaxy is visible along with dark dust lanes " +
      "that obscure the light from distant stars. This region offers some of " +
      "the darkest skies in the world for astronomical observation.",
    imageUrl: "/background.png",
    mediaType: "image",
    source: "fallback"
  };
}

/**
 * Get recent APOD entries (last N days)
 */
export async function getRecentAPOD(count: number = 5): Promise<APODData[]> {
  const today = new Date();
  const results: APODData[] = [];

  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    try {
      const apod = await getAPOD(dateStr);
      results.push(apod);
    } catch {
      // Skip failed entries
    }
  }

  return results;
}
