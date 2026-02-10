"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import useGeolocation from "@/hooks/useGeolocation";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

const fallbackCenter: [number, number] = [-115.1728, 36.1147];

type StarMapProps = {
  showLightPollution: boolean;
  overlayOpacity: number;
};

export default function StarMap({ showLightPollution, overlayOpacity }: StarMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const geo = useGeolocation();

  const lightPollutionTiles = useMemo(
    () => process.env.NEXT_PUBLIC_LIGHTPOLLUTION_TILES ?? "",
    []
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!mapboxgl.accessToken) return;

    const center: [number, number] =
      geo.lat !== null && geo.lng !== null ? [geo.lng, geo.lat] : fallbackCenter;

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center,
      zoom: 4
    });

    mapRef.current.on("load", () => {
      setReady(true);
    });

    return () => {
      mapRef.current?.remove();
    };
  }, [geo.lat, geo.lng]);

  useEffect(() => {
    if (!mapRef.current || geo.lat === null || geo.lng === null) return;
    mapRef.current.flyTo({ center: [geo.lng, geo.lat], zoom: 5, essential: true });
  }, [geo.lat, geo.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const sourceId = "light-pollution";
    const layerId = "light-pollution-layer";

    if (!lightPollutionTiles) {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      return;
    }

    if (showLightPollution) {
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: "raster",
          tiles: [lightPollutionTiles],
          tileSize: 256,
          attribution: "Light pollution tiles"
        });
      }

      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: "raster",
          source: sourceId,
          paint: {
            "raster-opacity": overlayOpacity
          }
        });
      } else {
        map.setPaintProperty(layerId, "raster-opacity", overlayOpacity);
      }
    } else {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    }
  }, [showLightPollution, lightPollutionTiles, ready, overlayOpacity]);

  return (
    <div className="relative h-64 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      {!mapboxgl.accessToken && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-starlight/60">
          Add `NEXT_PUBLIC_MAPBOX_TOKEN` to enable the live sky map.
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
      {ready && (
        <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-aurora/20 px-3 py-1 text-xs text-aurora">
          Live map
        </div>
      )}
    </div>
  );
}
