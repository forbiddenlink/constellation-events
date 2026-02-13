import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import PlannerDate from "@/components/PlannerDate";
import TonightPlannerPanel from "@/components/TonightPlannerPanel";

export const metadata: Metadata = {
  title: "Observation Planner",
  description: "Plan your stargazing session with moon phases, sunset times, visible planets, and meteor shower forecasts. Get personalized recommendations for tonight.",
  openGraph: {
    title: "Observation Planner | Constellation",
    description: "Plan your stargazing session with moon phases, visible planets, and meteor shower forecasts."
  }
};

export default function PlannerPage() {
  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Planner"
        title="Build your stargazing itinerary"
        subtitle="Blend the right night, the right horizon, and the best targets into one mission plan."
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <TonightPlannerPanel />
        <div className="space-y-6">
          <div className="glass rounded-3xl p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Plan context</div>
            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-starlight/50">Date</div>
                <div className="mt-2 text-sm text-starlight/80">
                  <PlannerDate />
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-starlight/50">Checklist focus</div>
                <div className="mt-2 text-sm text-starlight/80">
                  Best tonight for quick setup and visual observation sessions.
                </div>
              </div>
            </div>
          </div>
          <div className="glass rounded-3xl p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Mission checklist</div>
            <div className="mt-6 space-y-4 text-sm text-starlight/70">
              <div>Charge mount, tracker, and backup battery packs</div>
              <div>Pack red flashlight, lens cloth, and dew control</div>
              <div>Arrive 45 minutes before astronomical dusk</div>
              <div>Run alignment before switching to deep-sky targets</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
