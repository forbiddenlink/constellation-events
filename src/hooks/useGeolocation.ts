"use client";

import { useEffect, useState } from "react";

export type GeoState = {
  status: "idle" | "loading" | "ready" | "error";
  lat: number | null;
  lng: number | null;
  error: string | null;
};

const STORAGE_KEY = "constellation.location";

const DEFAULT_STATE: GeoState = {
  status: "idle",
  lat: null,
  lng: null,
  error: null
};

let sharedState: GeoState = { ...DEFAULT_STATE };
let requestStarted = false;
let storageChecked = false;
const listeners = new Set<(next: GeoState) => void>();

function emit(next: GeoState) {
  sharedState = next;
  // Persist successful location to localStorage
  if (next.status === "ready" && next.lat !== null && next.lng !== null) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ lat: next.lat, lng: next.lng })
      );
    } catch {
      // localStorage unavailable
    }
  }
  listeners.forEach((listener) => listener(next));
}

function loadSavedLocation() {
  if (storageChecked) return;
  storageChecked = true;
  if (typeof window === "undefined") return;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as { lat?: number; lng?: number };
      if (typeof parsed.lat === "number" && typeof parsed.lng === "number") {
        sharedState = {
          status: "ready",
          lat: parsed.lat,
          lng: parsed.lng,
          error: null
        };
      }
    }
  } catch {
    // localStorage unavailable or corrupt
  }
}

/**
 * Request browser geolocation permission.
 * Call this from a user-initiated action (button click) to avoid
 * unsolicited permission prompts.
 */
export function requestGeolocation() {
  if (requestStarted || sharedState.status === "loading") return;

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

/**
 * Set location manually (e.g. from a city search).
 * Updates all components using the hook and persists to localStorage.
 */
export function setManualLocation(lat: number, lng: number) {
  emit({ status: "ready", lat, lng, error: null });
}

export default function useGeolocation() {
  // Check localStorage on first call
  loadSavedLocation();

  const [state, setState] = useState<GeoState>(sharedState);

  useEffect(() => {
    // Sync with shared state in case it changed between render and effect
    if (state !== sharedState) {
      setState(sharedState);
    }
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
