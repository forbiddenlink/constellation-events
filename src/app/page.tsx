import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import ConstellationViz from "@/components/ConstellationViz";
import { generateUpcomingEvents } from "@/lib/events";
import TonightAtGlance from "@/components/TonightAtGlance";
import LiveSkyStatus from "@/components/LiveSkyStatus";
import APODCard from "@/components/APODCard";
import HeroStats from "@/components/HeroStats";
import DarkSkyPreview from "@/components/DarkSkyPreview";
import HomepageEvents from "@/components/HomepageEvents";
import HomepageLocations from "@/components/HomepageLocations";
import HomepageListings from "@/components/HomepageListings";
import LocationOnboarding from "@/components/LocationOnboarding";

export default function HomePage() {
  // Real astronomy events power the constellation star map (server-computed).
  const skyEvents = generateUpcomingEvents(undefined, new Date(), 60);

  return (
    <div className="space-y-16">
      <LocationOnboarding />
      <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <LiveSkyStatus />
          <h1 className="font-display text-4xl leading-tight text-starlight sm:text-5xl">
            Your nightly mission control for the sky above.
          </h1>
          <p className="max-w-xl text-base text-starlight/70">
            Whether you&apos;re a backyard stargazer or a deep-sky photographer, Constellation blends
            real-time celestial data, dark-sky scouting, and curated gear into one hub. Plan where to go,
            what to watch, and how to capture it.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/planner" className="button-primary">Generate Tonight Plan</Link>
            <Link href="/events" className="button-ghost">
              Explore events
            </Link>
          </div>
          <HeroStats />
        </div>
        <div className="space-y-6">
          <ConstellationViz events={skyEvents} />
          <TonightAtGlance />
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Today's Feature"
          title="Astronomy Picture of the Day"
          subtitle="NASA's daily showcase of our cosmos — from distant galaxies to breathtaking nebulae."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <APODCard />
          <HomepageEvents />
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Dark-Sky Finder"
          title="Scout the clearest horizons"
          subtitle="Light-pollution overlays and atmospheric scoring help you choose the perfect observation site in minutes."
        />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="glass relative min-h-[200px] sm:min-h-[320px] rounded-3xl p-6">
            <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_30%_30%,rgba(94,242,193,0.22),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(255,141,92,0.2),transparent_45%)]" />
            <div className="relative">
              <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Light pollution layers</div>
              <h3 className="mt-3 text-2xl font-semibold text-starlight">Sky quality map</h3>
              <p className="mt-2 text-sm text-starlight/70">
                Toggle Bortle scale, cloud cover, and moon illumination to plan your route.
              </p>
              <DarkSkyPreview />
              <Link href="/locations" className="mt-6 inline-flex text-sm text-aurora">
                Explore full map →
              </Link>
            </div>
          </div>
          <HomepageLocations />
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Marketplace"
          title="Curated gear for every observer"
        subtitle="Curated listings with detailed condition notes to help you find mission-ready gear."
        />
        <HomepageListings />
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
              <Link href="/planner" className="button-primary">Create a plan</Link>
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="text-xs uppercase tracking-[0.3em] text-starlight/50">Example itinerary</div>
            <div className="mt-4 space-y-3 text-sm text-starlight/70">
              <div>8:30 PM — Depart, 42 miles to Sierra Vista Overlook</div>
              <div>9:05 PM — Set up telescope and polar align</div>
              <div>9:20 PM — Jupiter and its moons</div>
              <div>10:15 PM — Orion Nebula imaging session</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
