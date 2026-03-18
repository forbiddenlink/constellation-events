"use client";

import { useEffect, useState } from "react";
import LocationCard from "@/components/LocationCard";
import type { DarkSkyLocation } from "@/lib/locations";
import useGeolocation from "@/hooks/useGeolocation";

type LocationsResponse = {
  locations: DarkSkyLocation[];
};

export default function HomepageLocations() {
  const [locations, setLocations] = useState<DarkSkyLocation[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const geo = useGeolocation();

  useEffect(() => {
    const params = new URLSearchParams();
    if (geo.status === "ready" && geo.lat !== null && geo.lng !== null) {
      params.set("lat", geo.lat.toFixed(4));
      params.set("lng", geo.lng.toFixed(4));
    }

    fetch(`/api/locations?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json() as Promise<LocationsResponse>;
      })
      .then((data) => {
        setLocations((data.locations ?? []).slice(0, 3));
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [geo.status, geo.lat, geo.lng]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass animate-pulse rounded-2xl p-5">
            <div className="h-5 w-36 rounded bg-white/10" />
            <div className="mt-3 h-3 w-full rounded bg-white/5" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-5 text-sm text-starlight/40">
        Dark-sky locations temporarily unavailable.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {locations.map((location) => (
        <LocationCard key={location.id} location={location} />
      ))}
      {locations.length === 0 && (
        <div className="glass rounded-2xl p-5 text-sm text-starlight/40">
          No dark-sky locations found.
        </div>
      )}
    </div>
  );
}
