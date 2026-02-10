"use client";

import { useEffect, useState } from "react";
import LocationCard from "@/components/LocationCard";
import type { DarkSkyLocation } from "@/lib/locations";
import useGeolocation from "@/hooks/useGeolocation";

type LocationsResponse = {
  locations: DarkSkyLocation[];
  location: { lat: number; lng: number } | null;
  userDarkSkyScore?: number;
  conditions?: {
    moonIllumination?: number;
    weatherQuality?: number | null;
    cloudCover?: number | null;
    weatherSource?: string | null;
  };
};

export default function LocationsFeed() {
  const [data, setData] = useState<LocationsResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const geo = useGeolocation();

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    const params = new URLSearchParams();
    if (geo.status === "ready" && geo.lat !== null && geo.lng !== null) {
      params.set("lat", geo.lat.toFixed(4));
      params.set("lng", geo.lng.toFixed(4));
    }

    fetch(`/api/locations?${params.toString()}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Locations request failed: ${res.status}`);
        }
        return res.json() as Promise<LocationsResponse>;
      })
      .then((payload: LocationsResponse) => {
        setData(payload);
        setStatus("idle");
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });

    return () => {
      controller.abort();
    };
  }, [geo.status, geo.lat, geo.lng]);

  if (status === "loading") {
    return <div className="text-sm text-starlight/60">Loading nearby dark-sky sites...</div>;
  }

  if (status === "error") {
    return <div className="text-sm text-ember">Locations unavailable right now.</div>;
  }

  return (
    <div className="space-y-4">
      {data ? (
        <div className="glass rounded-2xl p-4 text-xs text-starlight/70">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Local score {data.userDarkSkyScore ?? "n/a"}</span>
            <span>Moon {data.conditions?.moonIllumination?.toFixed(0) ?? "n/a"}%</span>
            <span>Clouds {data.conditions?.cloudCover ?? "n/a"}%</span>
            <span>Source {data.conditions?.weatherSource ?? "n/a"}</span>
          </div>
        </div>
      ) : null}
      {(data?.locations ?? []).map((location) => (
        <LocationCard key={location.id} location={location} />
      ))}
      {data && data.locations.length === 0 ? (
        <div className="glass rounded-2xl p-4 text-sm text-starlight/60">
          No listed dark-sky sites in this radius yet. Expand distance and try again.
        </div>
      ) : null}
    </div>
  );
}
