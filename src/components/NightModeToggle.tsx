"use client";

import { useNightMode } from "@/hooks/useNightMode";

/**
 * Toggle button for night vision mode
 *
 * When active, the entire app shifts to red-tinted colors
 * to preserve the user's dark-adapted vision in the field.
 */
export default function NightModeToggle() {
  const { isNightVision, toggle, mounted } = useNightMode();

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className="night-vision-toggle opacity-50"
        disabled
        aria-label="Loading night vision toggle"
      >
        <svg
          className="h-4 w-4 text-starlight/70 animate-pulse"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
        <span className="hidden sm:inline text-starlight/70" aria-hidden="true">NV</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="night-vision-toggle"
      aria-label={isNightVision ? "Disable night vision mode" : "Enable night vision mode"}
      title={isNightVision ? "Exit night vision mode" : "Enter night vision mode (red light)"}
    >
      {isNightVision ? (
        <>
          <svg
            className="h-4 w-4 text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
          </svg>
          <span className="hidden sm:inline text-red-400">NV ON</span>
        </>
      ) : (
        <>
          <svg
            className="h-4 w-4 text-starlight/70"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
          <span className="hidden sm:inline text-starlight/70" aria-hidden="true">NV</span>
        </>
      )}
    </button>
  );
}
