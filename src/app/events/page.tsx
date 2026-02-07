import SectionHeading from "@/components/SectionHeading";
import EventsFeed from "@/components/EventsFeed";

export default function EventsPage() {
  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Events"
        title="Celestial calendar"
        subtitle="Plan for meteor showers, planetary alignments, and rare lunar features with visibility scored by location."
      />
      <div className="glass rounded-3xl p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Filters</div>
            <div className="mt-4 flex flex-wrap gap-3">
              {[
                "Meteor showers",
                "Planets",
                "Lunar",
                "Deep sky",
                "Conjunctions"
              ].map((filter) => (
                <span
                  key={filter}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs text-starlight/70"
                >
                  {filter}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-starlight/70">
            Sync your location to recalibrate visibility scores and recommended times.
          </div>
        </div>
      </div>
      <EventsFeed />
    </div>
  );
}
