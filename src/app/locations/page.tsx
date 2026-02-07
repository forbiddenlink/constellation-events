"use client";

import { useState } from "react";
import SectionHeading from "@/components/SectionHeading";
import LocationsFeed from "@/components/LocationsFeed";
import StarMap from "@/components/StarMap";

export default function LocationsPage() {
  const [showLightPollution, setShowLightPollution] = useState(true);

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Dark-Sky Finder"
        title="Light pollution intelligence"
        subtitle="Layer satellite data, cloud cover, and moonlight to pinpoint your clearest horizon."
      />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass min-h-[420px] rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Sky quality map</div>
              <p className="mt-2 text-sm text-starlight/60">
                Toggle layers to compare light pollution with local conditions.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                className={`rounded-full border px-3 py-1 ${
                  showLightPollution ? "border-aurora text-aurora" : "border-white/20 text-starlight/60"
                }`}
                onClick={() => setShowLightPollution((prev) => !prev)}
              >
                Light pollution
              </button>
              <span className="rounded-full border border-white/20 px-3 py-1 text-starlight/60">Clouds</span>
              <span className="rounded-full border border-white/20 px-3 py-1 text-starlight/60">Moon</span>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Bortle", value: "2 - 3" },
              { label: "Clouds", value: "12%" },
              { label: "Moon", value: "18%" }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-starlight/50">{item.label}</div>
                <div className="mt-2 text-lg font-semibold text-aurora">{item.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <StarMap showLightPollution={showLightPollution} />
          </div>
          <p className="mt-4 text-sm text-starlight/60">
            Add `NEXT_PUBLIC_LIGHTPOLLUTION_TILES` to overlay a light pollution raster layer.
          </p>
        </div>
        <LocationsFeed />
      </div>
    </div>
  );
}
