"use client";

import { useEffect, useState } from "react";
import LocationCard from "@/components/LocationCard";
import type { LocationItem } from "@/lib/mock";
import useGeolocation from "@/hooks/useGeolocation";

type LocationsResponse = {
  spots: LocationItem[];
  location: { lat: string; lng: string } | null;
};

export default function LocationsFeed() {
  const [data, setData] = useState<LocationsResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const geo = useGeolocation();

  useEffect(() => {
    setStatus("loading");
    const params = new URLSearchParams();
    if (geo.status === "ready" && geo.lat !== null && geo.lng !== null) {
      params.set("lat", geo.lat.toFixed(4));
      params.set("lng", geo.lng.toFixed(4));
    }

    fetch(`/api/locations?${params.toString()}`)
      .then((res) => res.json())
      .then((payload: LocationsResponse) => {
        setData(payload);
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
  }, [geo.status, geo.lat, geo.lng]);

  if (status === "loading") {
    return <div className="text-sm text-starlight/60">Loading nearby dark-sky sites...</div>;
  }

  if (status === "error") {
    return <div className="text-sm text-ember">Locations unavailable right now.</div>;
  }

  return (
    <div className="space-y-4">
      {(data?.spots ?? []).map((location) => (
        <LocationCard key={location.id} location={location} />
      ))}
    </div>
  );
}
