"use client";

import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "dark" | "night-vision";

const STORAGE_KEY = "constellation-theme-mode";

/**
 * Hook to manage night vision mode for field use
 *
 * Night vision mode uses red-shifted colors to preserve
 * the user's dark adaptation while stargazing.
 */
export function useNightMode() {
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  // Apply mode to document
  const applyMode = useCallback((newMode: ThemeMode) => {
    if (typeof document !== "undefined") {
      if (newMode === "night-vision") {
        document.documentElement.classList.add("night-vision");
      } else {
        document.documentElement.classList.remove("night-vision");
      }
    }
  }, []);

  // Load saved preference on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved === "night-vision" || saved === "dark") {
      setModeState(saved);
      applyMode(saved);
    }
  }, [applyMode]);

  // Set mode and persist
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
    applyMode(newMode);
  }, [applyMode]);

  // Toggle between modes
  const toggle = useCallback(() => {
    const newMode = mode === "dark" ? "night-vision" : "dark";
    setMode(newMode);
  }, [mode, setMode]);

  // Check if night vision is active
  const isNightVision = mode === "night-vision";

  return {
    mode,
    setMode,
    toggle,
    isNightVision,
    mounted
  };
}
