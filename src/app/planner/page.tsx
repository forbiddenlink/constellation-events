import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import PlannerDate from "@/components/PlannerDate";
import PlannerLocationSearch from "@/components/PlannerLocationSearch";
import TonightPlannerPanel from "@/components/TonightPlannerPanel";

export const metadata: Metadata = {
  title: "Observation Planner",
  description: "Plan your stargazing session with moon phases, sunset times, visible planets, and meteor shower forecasts. Get personalized recommendations for tonight.",
  openGraph: {
    title: "Observation Planner | Constellation",
    description: "Plan your stargazing session with moon phases, visible planets, and meteor shower forecasts.",
    images: ["/opengraph-image"]
  }
};

export default function PlannerPage() {
  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Planner"
        title="Build your stargazing itinerary"
        subtitle="Blend the right night, the right horizon, and the best targets into one mission plan."
        as="h1"
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <TonightPlannerPanel />
        <div className="order-last lg:order-none space-y-6">
          <div className="glass rounded-3xl p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Plan settings</div>
            <div className="mt-6 grid gap-4">
              <PlannerLocationSearch />
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-starlight/50">Date</div>
                <div className="mt-2 text-sm text-starlight/80">
                  <PlannerDate />
                </div>
                <div className="mt-1 text-[10px] text-starlight/30">Plans are generated for tonight</div>
              </div>
            </div>
          </div>
          <div className="glass rounded-3xl p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">General tips</div>
            <div className="mt-6 space-y-4 text-sm text-starlight/70">
              <div>Charge all devices — scope, tracker, battery packs</div>
              <div>Pack red flashlight, lens cloth, and dew shield</div>
              <div>Arrive 45 minutes before full darkness</div>
              <div>Align your telescope before moving to fainter objects</div>
            </div>
          </div>
          <div className="glass rounded-3xl p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Example itinerary</div>
            <div className="mt-4 space-y-3 text-sm text-starlight/70">
              <div>8:30 PM — Depart, 42 miles to Sierra Vista Overlook</div>
              <div>9:05 PM — Set up telescope and polar align</div>
              <div>9:20 PM — Jupiter and its moons</div>
              <div>10:15 PM — Orion Nebula imaging session</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
