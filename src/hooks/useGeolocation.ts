"use client";

import { useEffect, useState } from "react";

export type GeoState = {
  status: "idle" | "loading" | "ready" | "error";
  lat: number | null;
  lng: number | null;
  error: string | null;
};

const DEFAULT_STATE: GeoState = {
  status: "idle",
  lat: null,
  lng: null,
  error: null
};

let sharedState: GeoState = { ...DEFAULT_STATE };
let requestStarted = false;
const listeners = new Set<(next: GeoState) => void>();

function emit(next: GeoState) {
  sharedState = next;
  listeners.forEach((listener) => listener(next));
}

function startGeolocationRequest() {
  if (requestStarted || sharedState.status === "ready" || sharedState.status === "error") return;

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    emit({ status: "error", lat: null, lng: null, error: "Geolocation unavailable" });
    return;
  }

  requestStarted = true;
  emit({ ...sharedState, status: "loading" });

  navigator.geolocation.getCurrentPosition(
    (position) => {
      emit({
        status: "ready",
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        error: null
      });
    },
    (error) => {
      emit({
        status: "error",
        lat: null,
        lng: null,
        error: error.message
      });
    },
    { enableHighAccuracy: false, timeout: 8000 }
  );
}

export default function useGeolocation() {
  const [state, setState] = useState<GeoState>(sharedState);

  useEffect(() => {
    listeners.add(setState);
    startGeolocationRequest();
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return state;
}
