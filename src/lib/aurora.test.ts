import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchAuroraForecast, type AuroraForecast } from "./aurora";

describe("aurora forecasts", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses NOAA Kp data correctly", async () => {
    const mockCurrentData = [
      ["time_tag", "Kp", "observed", "noaa_scale"],
      ["2026-02-13 00:00:00", "2.33", "observed", "0"],
      ["2026-02-13 03:00:00", "3.67", "observed", "0"]
    ];

    const mockForecastData = [
      ["time_tag", "Kp", "observed", "noaa_scale"],
      ["2026-02-13 06:00:00", "4.00", "predicted", "0"],
      ["2026-02-13 09:00:00", "3.00", "predicted", "0"]
    ];

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCurrentData)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockForecastData)
      } as Response);

    const result = await fetchAuroraForecast(45);

    expect(result.current.kp).toBe(3.7); // Rounded from 3.67
    expect(result.source).toBe("noaa");
    expect(result.forecast).toHaveLength(2);
  });

  it("calculates storm level correctly", async () => {
    const mockCurrentData = [
      ["time_tag", "Kp", "observed", "noaa_scale"],
      ["2026-02-13 00:00:00", "7.50", "observed", "3"]
    ];

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCurrentData)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      } as Response);

    const result = await fetchAuroraForecast(45);

    expect(result.current.kp).toBe(7.5);
    expect(result.current.stormLevel).toBe("strong");
  });

  it("calculates visibility probability based on latitude", async () => {
    const mockCurrentData = [
      ["time_tag", "Kp", "observed", "noaa_scale"],
      ["2026-02-13 00:00:00", "5.00", "observed", "1"]
    ];

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCurrentData)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      } as Response);

    // Kp 5 = minimum latitude ~52°
    // User at 65° (13° above minimum) should have high visibility
    const result = await fetchAuroraForecast(65);

    expect(result.visibility.probability).toBe("high");
    expect(result.visibility.minimumLatitude).toBe(52);
  });

  it("returns low probability for southern latitudes", async () => {
    const mockCurrentData = [
      ["time_tag", "Kp", "observed", "noaa_scale"],
      ["2026-02-13 00:00:00", "3.00", "observed", "0"]
    ];

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCurrentData)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      } as Response);

    // Kp 3 = minimum latitude ~58°
    // User at 36° (Las Vegas) should have no visibility
    const result = await fetchAuroraForecast(36);

    expect(result.visibility.probability).toBe("none");
  });

  it("falls back to estimated when NOAA fails", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    const result = await fetchAuroraForecast(45);

    expect(result.source).toBe("estimated");
    expect(result.current.kp).toBe(2);
    expect(result.current.stormLevel).toBe("none");
  });

  it("handles NOAA API error responses", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 503
    } as Response);

    const result = await fetchAuroraForecast(45);

    expect(result.source).toBe("estimated");
  });
});
