"use client";

import { useEffect, useState } from "react";

export type GeoState = {
  status: "idle" | "loading" | "ready" | "error";
  lat: number | null;
  lng: number | null;
  error: string | null;
};

export default function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    status: "idle",
    lat: null,
    lng: null,
    error: null
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ status: "error", lat: null, lng: null, error: "Geolocation unavailable" });
      return;
    }

    setState((prev) => ({ ...prev, status: "loading" }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          status: "ready",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          error: null
        });
      },
      (err) => {
        setState({ status: "error", lat: null, lng: null, error: err.message });
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  return state;
}
