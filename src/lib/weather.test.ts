import { afterEach, describe, expect, it, vi } from "vitest";

async function loadWeatherModule(provider: string, openWeatherKey?: string) {
  vi.resetModules();
  process.env.WEATHER_API_PROVIDER = provider;
  if (openWeatherKey) {
    process.env.OPENWEATHER_API_KEY = openWeatherKey;
  } else {
    delete process.env.OPENWEATHER_API_KEY;
  }
  return import("./weather");
}

describe("weather providers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.WEATHER_API_PROVIDER;
    delete process.env.OPENWEATHER_API_KEY;
  });

  it("uses Open-Meteo when provider is openmeteo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          current: {
            cloud_cover: 22,
            relative_humidity_2m: 38,
            wind_speed_10m: 6,
            temperature_2m: 11
          }
        })
      })
    );

    const { fetchSkyQuality } = await loadWeatherModule("openmeteo");
    const result = await fetchSkyQuality(36.1, -115.1);

    expect(result.source).toBe("openmeteo");
    expect(result.cloudCover).toBe(22);
    expect(result.temperature).toBe(11);
  });

  it("falls back to estimated values when remote weather fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503
      })
    );

    const { fetchSkyQuality } = await loadWeatherModule("openmeteo");
    const result = await fetchSkyQuality(36.1, -115.1);

    expect(result.source).toBe("estimated");
    expect(result.quality).toBeGreaterThan(0);
  });

  it("prefers OpenWeather in auto mode when key is available", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        clouds: { all: 19 },
        main: { humidity: 42, temp: 12 },
        wind: { speed: 2.4 }
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const { fetchSkyQuality } = await loadWeatherModule("auto", "fake-key");
    const result = await fetchSkyQuality(36.1, -115.1);

    expect(result.source).toBe("openweather");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("openweathermap.org");
  });

  it("uses Open-Meteo in auto mode when OpenWeather key is missing", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: {
          cloud_cover: 35,
          relative_humidity_2m: 44,
          wind_speed_10m: 9,
          temperature_2m: 10
        }
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const { fetchSkyQuality } = await loadWeatherModule("auto");
    const result = await fetchSkyQuality(36.1, -115.1);

    expect(result.source).toBe("openmeteo");
    expect(fetchMock.mock.calls[0][0]).toContain("api.open-meteo.com");
  });
});
