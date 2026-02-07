import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import StatCard from "@/components/StatCard";
import EventCard from "@/components/EventCard";
import LocationCard from "@/components/LocationCard";
import ListingCard from "@/components/ListingCard";
import ConstellationViz from "@/components/ConstellationViz";
import TonightAtGlance from "@/components/TonightAtGlance";
import LiveSkyStatus from "@/components/LiveSkyStatus";
import { featuredListings, nearbyLocations, upcomingEvents } from "@/lib/mock";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <LiveSkyStatus />
          <h1 className="font-display text-4xl leading-tight text-starlight sm:text-5xl">
            Your nightly mission control for the sky above.
          </h1>
          <p className="max-w-xl text-base text-starlight/70">
            Constellation blends real-time celestial data, dark-sky scouting, and curated gear into one
            cinematic stargazing hub. Plan where to go, what to watch, and how to capture it.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="button-primary">Generate Tonight Plan</button>
            <Link href="/events" className="button-ghost">
              Explore events
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Tonight" value="7 prime targets" detail="Moon low, seeing high" />
            <StatCard label="Dark sky" value="92 score" detail="Best nearby window 9pm-2am" />
            <StatCard label="Next event" value="Feb 9" detail="Venus greatest elongation" />
          </div>
        </div>
        <div className="space-y-6">
          <ConstellationViz />
          <TonightAtGlance />
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Forecast"
          title="Upcoming celestial events"
          subtitle="Stay ahead of every transit, meteor shower, and lunar feature with precision timing and visibility notes."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {upcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Dark-Sky Finder"
          title="Scout the clearest horizons"
          subtitle="Light-pollution overlays and atmospheric scoring help you choose the perfect observation site in minutes."
        />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="glass relative min-h-[320px] rounded-3xl p-6">
            <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_30%_30%,rgba(94,242,193,0.22),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(255,141,92,0.2),transparent_45%)]" />
            <div className="relative">
              <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Light pollution layers</div>
              <h3 className="mt-3 text-2xl font-semibold text-starlight">Sky quality map</h3>
              <p className="mt-2 text-sm text-starlight/70">
                Toggle Bortle scale, cloud cover, and moon illumination to plan your route.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-starlight/50">Bortle</div>
                  <div className="mt-2 text-lg font-semibold text-aurora">2 - 3</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-starlight/50">Clouds</div>
                  <div className="mt-2 text-lg font-semibold text-starlight">12%</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-starlight/50">Moon</div>
                  <div className="mt-2 text-lg font-semibold text-ember">18%</div>
                </div>
              </div>
              <Link href="/locations" className="mt-6 inline-flex text-sm text-aurora">
                Explore full map →
              </Link>
            </div>
          </div>
          <div className="space-y-4">
            {nearbyLocations.map((location) => (
              <LocationCard key={location.id} location={location} />
            ))}
          </div>
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Marketplace"
          title="Curated gear for every observer"
          subtitle="Verified listings, trusted condition notes, and community ratings keep your kit mission-ready."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {featuredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="glass rounded-3xl p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <SectionHeading
              eyebrow="Planner"
              title="Build a full-night itinerary"
              subtitle="Combine your best viewing window, drive time, and object list into a single shareable plan."
            />
            <div className="flex flex-wrap gap-4">
              <button className="button-primary">Create a plan</button>
              <Link href="/planner" className="button-ghost">
                Open planner
              </Link>
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Sample itinerary</div>
            <div className="mt-4 space-y-3 text-sm text-starlight/70">
              <div>8:30 PM — Depart city, 42 miles to Sierra Vista Overlook</div>
              <div>9:05 PM — Setup, align mount, calibrate tracker</div>
              <div>9:20 PM — Jupiter transit + moons</div>
              <div>10:15 PM — Orion Nebula imaging</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
