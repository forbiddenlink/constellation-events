import SectionHeading from "@/components/SectionHeading";
import PlannerDate from "@/components/PlannerDate";

export default function PlannerPage() {
  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Planner"
        title="Build your stargazing itinerary"
        subtitle="Blend the right night, the right horizon, and the best targets into one mission plan."
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass rounded-3xl p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Plan inputs</div>
          <div className="mt-6 grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-starlight/50">Date</div>
              <div className="mt-2 text-sm text-starlight/80">
                <PlannerDate />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-starlight/50">Location</div>
              <div className="mt-2 text-sm text-starlight/80">Sierra Vista Overlook</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-starlight/50">Targets</div>
              <div className="mt-2 text-sm text-starlight/80">Jupiter, Orion Nebula, Pleiades</div>
            </div>
          </div>
          <button className="button-primary mt-6 w-full">Generate route + checklist</button>
        </div>
        <div className="glass rounded-3xl p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Mission checklist</div>
          <div className="mt-6 space-y-4 text-sm text-starlight/70">
            <div>Charge tracker battery + dew heater</div>
            <div>Pack red light, charts, and power bank</div>
            <div>Set up polar alignment by 9:15 PM</div>
            <div>Capture 30-minute exposures after 10:30 PM</div>
          </div>
        </div>
      </div>
    </div>
  );
}
