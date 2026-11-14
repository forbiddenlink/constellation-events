import type { Metadata } from "next";
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
    <div className="plan-root">
      <h1 className="display-sm">Build your stargazing itinerary</h1>
      <p className="lede plan-lede">The window, the targets and the notes for tonight, at the place you choose.</p>

      <section className="log-page plan-page" aria-label="Tonight's plan">
        <div className="field-row">
          <span className="plan-field-label">Place</span>
          <PlannerLocationSearch />
        </div>
        <div className="field-row">
          <span className="plan-field-label">Date</span>
          <div className="plan-date">
            <PlannerDate />
            <span className="plan-sub">Plans are generated for tonight</span>
          </div>
        </div>
        <TonightPlannerPanel />
      </section>

      <div className="plan-extras">
        <section aria-labelledby="tips-h">
          <h2 id="tips-h" className="plan-h2">General tips</h2>
          <ul className="plan-tips">
            <li>Charge all devices: scope, tracker, battery packs</li>
            <li>Pack red flashlight, lens cloth, and dew shield</li>
            <li>Arrive 45 minutes before full darkness</li>
            <li>Align your telescope before moving to fainter objects</li>
          </ul>
        </section>
        <section aria-labelledby="sample-h">
          <h2 id="sample-h" className="plan-h2">
            Example itinerary <span className="stamp plan-stamp">Sample</span>
          </h2>
          <ol className="plan-tips">
            <li>8:30 PM: Depart, 42 miles to Sierra Vista Overlook</li>
            <li>9:05 PM: Set up telescope and polar align</li>
            <li>9:20 PM: Jupiter and its moons</li>
            <li>10:15 PM: Orion Nebula imaging session</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
